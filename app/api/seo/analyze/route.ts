import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const DEFAULT_BASE_URL = 'http://localhost:3011';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const urlParam = searchParams.get('url');
    if (!urlParam) {
      return NextResponse.json({ success: false, error: 'url parameter is required' }, { status: 400 });
    }

    const baseHost = process.env.FRONTEND_URL || DEFAULT_BASE_URL;
    // Construct target URL safely
    const targetUrl = urlParam.startsWith('http') ? urlParam : `${baseHost.replace(/\/$/, '')}${urlParam.startsWith('/') ? '' : '/'}${urlParam}`;

    const startTime = Date.now();
    const res = await fetch(targetUrl, { signal: AbortSignal.timeout(10000) });
    const loadTime = Date.now() - startTime;

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch page: HTTP status ${res.status}`
      }, { status: 500 });
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    let missingAlt = 0;
    const images: { src: string; alt: string | null }[] = [];
    $('img').each((_, img) => {
      const src = $(img).attr('src') || '';
      const alt = $(img).attr('alt') || null;
      if (!alt || alt.trim() === '') {
        missingAlt++;
      }
      images.push({ src, alt });
    });

    const headings = {
      h1: [] as string[],
      h2: [] as string[],
      h3: [] as string[]
    };
    $('h1').each((_, el) => { headings.h1.push($(el).text().trim()) });
    $('h2').each((_, el) => { headings.h2.push($(el).text().trim()) });
    $('h3').each((_, el) => { headings.h3.push($(el).text().trim()) });

    const meta = {
      title: $('title').text() || $('meta[property="og:title"]').attr('content') || '',
      description: $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '',
      keywords: $('meta[name="keywords"]').attr('content') || '',
      canonical: $('link[rel="canonical"]').attr('href') || '',
      ogTitle: $('meta[property="og:title"]').attr('content') || '',
      ogDescription: $('meta[property="og:description"]').attr('content') || '',
      ogImage: $('meta[property="og:image"]').attr('content') || '',
      robots: $('meta[name="robots"]').attr('content') || '',
      schemaCount: $('script[type="application/ld+json"]').length
    };

    // Calculate score
    let score = 100;
    const checklist = [];

    // Title checks
    if (!meta.title) {
      score -= 15;
      checklist.push({ name: 'Title Tag', status: 'error', message: 'Title tag is missing entirely.' });
    } else if (meta.title.length < 30 || meta.title.length > 60) {
      score -= 7;
      checklist.push({ name: 'Title Length', status: 'warning', message: `Title length (${meta.title.length}) is not optimal (should be 30-60 characters).` });
    } else {
      checklist.push({ name: 'Title Tag', status: 'success', message: 'Title is present and has optimal length.' });
    }

    // Description checks
    if (!meta.description) {
      score -= 15;
      checklist.push({ name: 'Meta Description', status: 'error', message: 'Meta description is missing entirely.' });
    } else if (meta.description.length < 70 || meta.description.length > 160) {
      score -= 7;
      checklist.push({ name: 'Description Length', status: 'warning', message: `Description length (${meta.description.length}) is not optimal (should be 70-160 characters).` });
    } else {
      checklist.push({ name: 'Meta Description', status: 'success', message: 'Description is present and has optimal length.' });
    }

    // Canonical checks
    if (!meta.canonical) {
      score -= 10;
      checklist.push({ name: 'Canonical URL', status: 'warning', message: 'Canonical link is missing.' });
    } else {
      checklist.push({ name: 'Canonical URL', status: 'success', message: 'Canonical link is present.' });
    }

    // Keyword checks
    if (!meta.keywords) {
      score -= 5;
      checklist.push({ name: 'Meta Keywords', status: 'warning', message: 'Meta keywords are missing.' });
    } else {
      checklist.push({ name: 'Meta Keywords', status: 'success', message: 'Keywords are present.' });
    }

    // H1 headings
    if (headings.h1.length === 0) {
      score -= 10;
      checklist.push({ name: 'H1 Tag', status: 'error', message: 'Page is missing H1 header tag.' });
    } else if (headings.h1.length > 1) {
      score -= 5;
      checklist.push({ name: 'H1 Count', status: 'warning', message: `Multiple H1 tags (${headings.h1.length}) found. Only one H1 should be used.` });
    } else {
      checklist.push({ name: 'H1 Tag', status: 'success', message: 'Page has exactly one H1 tag.' });
    }

    // H2 headings
    if (headings.h2.length === 0) {
      score -= 5;
      checklist.push({ name: 'H2 Tag', status: 'warning', message: 'No H2 headers found. Structure page with H2 tags.' });
    } else {
      checklist.push({ name: 'H2 Tag', status: 'success', message: `Page has ${headings.h2.length} H2 tags.` });
    }

    // Image alt attributes
    if (images.length === 0) {
      checklist.push({ name: 'Image Alt Tags', status: 'success', message: 'No images found on the page.' });
    } else if (missingAlt > 0) {
      score -= Math.min(15, missingAlt * 3);
      checklist.push({ name: 'Image Alt Tags', status: 'warning', message: `${missingAlt} images are missing alternate text (alt attributes).` });
    } else {
      checklist.push({ name: 'Image Alt Tags', status: 'success', message: 'All images have alt text.' });
    }

    // Schema
    if (meta.schemaCount === 0) {
      score -= 5;
      checklist.push({ name: 'Structured Data (Schema)', status: 'warning', message: 'Structured data (JSON-LD schema) was not found.' });
    } else {
      checklist.push({ name: 'Structured Data (Schema)', status: 'success', message: `Found structured data schema markup.` });
    }

    const finalScore = Math.max(0, Math.min(100, score));

    return NextResponse.json({
      success: true,
      data: {
        url: targetUrl,
        score: finalScore,
        loadTimeMs: loadTime,
        meta,
        headings,
        missingAltCount: missingAlt,
        checklist
      }
    });
  } catch (error: any) {
    console.error('Page analysis error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Analysis failed' }, { status: 500 });
  }
}
