import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';
import * as cheerio from 'cheerio';

const DEFAULT_BASE_URL = 'http://localhost:3011';

// Score calculation formula
const calculateSeoScore = (seo: {
  metaTitle: string;
  metaDescription: string;
  metaCanonical: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  h1Count: number;
  h2Count: number;
  imageAltMissingCount: number;
  robots: string | null;
}) => {
  let score = 100;
  if (!seo.metaTitle) score -= 15;
  else if (seo.metaTitle.length < 30 || seo.metaTitle.length > 60) score -= 7;

  if (!seo.metaDescription) score -= 15;
  else if (seo.metaDescription.length < 70 || seo.metaDescription.length > 160) score -= 7;

  if (!seo.metaCanonical) score -= 10;
  if (!seo.metaKeywords) score -= 5;
  if (!seo.ogTitle) score -= 5;
  if (!seo.ogDescription) score -= 5;
  if (!seo.ogImage) score -= 5;

  if (seo.robots && (seo.robots.includes('noindex') || seo.robots.includes('nofollow'))) score -= 10;
  if (seo.imageAltMissingCount > 0) score -= Math.min(15, seo.imageAltMissingCount * 3);
  
  if (seo.h1Count === 0) score -= 10;
  else if (seo.h1Count > 1) score -= 5;
  
  if (seo.h2Count === 0) score -= 5;

  return Math.max(0, Math.min(100, Math.round(score)));
};

export async function GET() {
  try {
    await requireRole(['superadmin', 'admin']);
    const db = await getDb();
    
    const audits = await db.collection('seo_audits').find().sort({ created_at: -1 }).toArray();
    
    const data = audits.map(a => ({
      id: a._id.toString(),
      overallScore: a.overallScore,
      pagesScore: a.pagesScore,
      blogsScore: a.blogsScore,
      websiteScore: a.websiteScore,
      totalPagesCrawled: a.totalPagesCrawled,
      totalBlogsCrawled: a.totalBlogsCrawled,
      pageReports: a.pageReports || [],
      globalChecks: a.globalChecks || {},
      created_at: a.created_at || a.createdAt
    }));
    
    return NextResponse.json({ success: true, data } as ApiResponse<typeof data>, { status: 200 });
  } catch (error: any) {
    console.error('SEO audits GET error:', error);
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' } as ApiResponse<null>, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['superadmin', 'admin']);
    const db = await getDb();
    
    // Determine the base URL to crawl
    const globalSettings = await db.collection('seo_global').findOne({ type: 'global' });
    const BASE_URL = process.env.FRONTEND_URL || globalSettings?.siteUrl || DEFAULT_BASE_URL;
    
    console.log(`[SEO Crawler] Starting crawl for base URL: ${BASE_URL}`);

    // Collect all page routes (reusing route.ts logic)
    const routes: { label: string; value: string; type: 'static' | 'blog' | 'service' | 'product' | 'other' }[] = [];
    
    // 1. Static routes
    const staticRoutes = [
      '/',
      '/about-us',
      '/contact',
      '/blogs',
      '/services',
      '/categories',
      '/careers',
      '/events',
      '/global-presence',
      '/industry-solutions',
      '/manufacturing-infrastructure',
      '/products',
      '/quality-certification',
      '/team',
      '/terms-and-conditions'
    ];
    
    staticRoutes.forEach(route => {
      routes.push({ label: `Static: ${route === '/' ? 'Home' : route}`, value: route, type: 'static' });
    });
    
    // 2. Dynamic routes
    const dynamicMappings = [
      { collection: 'blog', pathPrefix: '/blogs', labelPrefix: 'Blog', type: 'blog' as const },
      { collection: 'service', pathPrefix: '/services', labelPrefix: 'Service', type: 'service' as const },
      { collection: 'categories', pathPrefix: '/categories', labelPrefix: 'Category', type: 'other' as const },
      { collection: 'our_products', pathPrefix: '/products', labelPrefix: 'Product', type: 'product' as const },
      { collection: 'career-info', pathPrefix: '/careers', labelPrefix: 'Career', type: 'other' as const },
      { collection: 'events', pathPrefix: '/events', labelPrefix: 'Event', type: 'other' as const }
    ];
    
    for (const mapping of dynamicMappings) {
      try {
        const docs = await db.collection(mapping.collection).find({}, { projection: { slug: 1 } }).toArray();
        docs.forEach(doc => {
          if (doc.slug) {
            routes.push({
              label: `${mapping.labelPrefix}: ${doc.slug}`,
              value: `${mapping.pathPrefix}/${doc.slug}`,
              type: mapping.type
            });
          }
        });
      } catch (err) {
        // Skip missing collections
      }
    }
    
    // 3. Team routes
    try {
      const teamDocs = await db.collection('our_team').find({}, { projection: { _id: 1 } }).toArray();
      teamDocs.forEach(doc => {
        routes.push({
          label: `Team: ${doc._id.toString()}`,
          value: `/team/${doc._id.toString()}`,
          type: 'other'
        });
      });
    } catch (err) {}

    // Run crawler limit to first 12 pages to avoid timeouts, prioritizing important layouts
    const targetPages = routes.slice(0, 15);
    const pageReports = [];
    
    let totalPagesCrawled = 0;
    let totalBlogsCrawled = 0;
    let totalPagesScoreSum = 0;
    let totalBlogsScoreSum = 0;
    let totalLoadTime = 0;

    for (const page of targetPages) {
      const pageUrl = `${BASE_URL.replace(/\/$/, '')}${page.value}`;
      const startTime = Date.now();
      
      let html = '';
      let loadTime = 0;
      const errors = [];
      const warnings = [];
      const infos = [];
      
      try {
        const res = await fetch(pageUrl, { signal: AbortSignal.timeout(10000) });
        loadTime = Date.now() - startTime;
        totalLoadTime += loadTime;
        
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        
        html = await res.text();
      } catch (err: any) {
        errors.push(`Could not fetch HTML: ${err.message || err}`);
        pageReports.push({
          url: pageUrl,
          pageSlug: page.value,
          score: 0,
          type: page.type,
          loadTime: Date.now() - startTime,
          errors,
          warnings,
          infos,
          details: {}
        });
        continue;
      }
      
      try {
        const $ = cheerio.load(html);
        
        let missingAlt = 0;
        $('img').each((_, img) => {
          const alt = $(img).attr('alt');
          if (!alt || alt.trim() === '') {
            missingAlt++;
          }
        });
        
        const seoData = {
          metaTitle: $('title').text() || $('meta[property="og:title"]').attr('content') || '',
          metaDescription: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '',
          metaKeywords: $('meta[name="keywords"]').attr('content') || '',
          metaCanonical: $('link[rel="canonical"]').attr('href') || '',
          ogTitle: $('meta[property="og:title"]').attr('content') || '',
          ogDescription: $('meta[property="og:description"]').attr('content') || '',
          ogImage: $('meta[property="og:image"]').attr('content') || '',
          h1Count: $('h1').length,
          h2Count: $('h2').length,
          imageAltMissingCount: missingAlt,
          robots: $('meta[name="robots"]').attr('content') || null
        };
        
        const score = calculateSeoScore(seoData);
        
        // Populate warnings & errors
        if (!seoData.metaTitle) {
          errors.push('Title tag is missing');
        } else if (seoData.metaTitle.length < 30 || seoData.metaTitle.length > 60) {
          warnings.push(`Title length (${seoData.metaTitle.length}) is not optimal (30-60 characters)`);
        }
        
        if (!seoData.metaDescription) {
          errors.push('Meta description is missing');
        } else if (seoData.metaDescription.length < 70 || seoData.metaDescription.length > 160) {
          warnings.push(`Description length (${seoData.metaDescription.length}) is not optimal (70-160 characters)`);
        }
        
        if (!seoData.metaCanonical) {
          warnings.push('Canonical URL link is missing');
        }
        if (missingAlt > 0) {
          warnings.push(`${missingAlt} images are missing alternative text (alt attributes)`);
        }
        if (seoData.h1Count === 0) {
          errors.push('H1 heading tag is missing');
        } else if (seoData.h1Count > 1) {
          warnings.push(`Multiple H1 tags (${seoData.h1Count}) found on this page`);
        }
        if (seoData.h2Count === 0) {
          warnings.push('No H2 heading tags found');
        }
        
        pageReports.push({
          url: pageUrl,
          pageSlug: page.value,
          type: page.type,
          score,
          loadTime,
          errors,
          warnings,
          infos,
          details: seoData
        });
        
        if (page.type === 'blog') {
          totalBlogsScoreSum += score;
          totalBlogsCrawled++;
        } else {
          totalPagesScoreSum += score;
          totalPagesCrawled++;
        }
      } catch (err: any) {
        errors.push(`Failed to parse HTML structure: ${err.message}`);
        pageReports.push({
          url: pageUrl,
          pageSlug: page.value,
          score: 0,
          type: page.type,
          loadTime,
          errors,
          warnings,
          infos,
          details: {}
        });
      }
    }
    
    const pagesScore = totalPagesCrawled > 0 ? Math.round(totalPagesScoreSum / totalPagesCrawled) : 0;
    const blogsScore = totalBlogsCrawled > 0 ? Math.round(totalBlogsScoreSum / totalBlogsCrawled) : 0;
    
    // Global Checks
    let hasRobots = false;
    try {
      const res = await fetch(`${BASE_URL.replace(/\/$/, '')}/robots.txt`, { signal: AbortSignal.timeout(5000) });
      hasRobots = res.status === 200;
    } catch (e) {}

    let hasSitemap = false;
    try {
      const res = await fetch(`${BASE_URL.replace(/\/$/, '')}/sitemap.xml`, { signal: AbortSignal.timeout(5000) });
      hasSitemap = res.status === 200;
    } catch (e) {}

    const hasSSL = BASE_URL.startsWith('https');

    let isResponsive = false;
    let hasSchema = false;
    try {
      const res = await fetch(BASE_URL, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const text = await res.text();
        const $ = cheerio.load(text);
        isResponsive = $('meta[name="viewport"]').length > 0;
        hasSchema = $('script[type="application/ld+json"]').length > 0;
      }
    } catch (e) {}

    const globalScore = (hasRobots ? 20 : 0) + (hasSitemap ? 20 : 0) + (hasSSL ? 20 : 0) + (isResponsive ? 20 : 0) + (hasSchema ? 20 : 0);

    const totalAudited = totalPagesCrawled + totalBlogsCrawled;
    const overallScore = totalAudited > 0 
      ? Math.round((pagesScore * totalPagesCrawled + blogsScore * totalBlogsCrawled + globalScore) / (totalAudited + 1)) 
      : globalScore;

    const newAudit = {
      overallScore,
      pagesScore,
      blogsScore,
      websiteScore: globalScore,
      totalPagesCrawled,
      totalBlogsCrawled,
      pageReports,
      globalChecks: {
        robots: hasRobots,
        sitemap: hasSitemap,
        ssl: hasSSL,
        responsive: isResponsive,
        schemaFound: hasSchema,
        avgPageSpeedMs: Math.round(totalLoadTime / (pageReports.length || 1))
      },
      created_at: new Date().toISOString()
    };

    const result = await db.collection('seo_audits').insertOne(newAudit);
    
    return NextResponse.json({
      success: true,
      message: 'Audit completed successfully',
      data: { id: result.insertedId.toString(), ...newAudit }
    } as ApiResponse<any>, { status: 200 });
  } catch (error: any) {
    console.error('SEO audit failed:', error);
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ success: false, error: error.message || 'Audit execution failed' } as ApiResponse<null>, { status });
  }
}

export async function DELETE() {
  try {
    await requireRole(['superadmin', 'admin']);
    const db = await getDb();
    
    await db.collection('seo_audits').deleteMany({});
    
    return NextResponse.json({ success: true, message: 'Audit history cleared successfully' } as ApiResponse<any>, { status: 200 });
  } catch (error: any) {
    console.error('SEO audits DELETE error:', error);
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' } as ApiResponse<null>, { status });
  }
}
