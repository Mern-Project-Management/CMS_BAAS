import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

export async function GET() {
  try {
    const db = await getDb();
    
    let settings = await db.collection('seo_global').findOne({ type: 'global' });
    
    if (!settings) {
      // Seed default settings on first request
      const defaultSettings = {
        type: 'global',
        siteName: 'Wiretex Manufacturing',
        siteUrl: 'https://www.wiretex.com',
        googleAnalyticsId: '',
        searchConsoleVerification: '',
        twitterHandle: '',
        defaultOgImage: '',
        socialLinks: [
          { platformName: 'LinkedIn', url: '' },
          { platformName: 'Twitter', url: '' },
          { platformName: 'Facebook', url: '' }
        ],
        businessName: 'Wiretex Ltd.',
        businessPhone: '',
        businessEmail: '',
        locations: [
          {
            locationName: 'Headquarters',
            phone: '',
            hours: '9 AM - 5 PM',
            address: '',
            city: '',
            zip: ''
          }
        ],
        robotsTxt: "User-agent: *\nDisallow: /api/\n\nSitemap: https://www.wiretex.com/sitemap.xml",
        llmTxt: "# Wiretex Manufacturing\n\n## About Us\nWiretex is a leading manufacturer of high-quality industrial components.\n\n## Products & Solutions\n- Precision wires\n- Metal grids\n- Specialized steel meshes",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const res = await db.collection('seo_global').insertOne(defaultSettings);
      settings = { _id: res.insertedId, ...defaultSettings };
    }
    
    return NextResponse.json({ success: true, data: settings } as ApiResponse<typeof settings>, { status: 200 });
  } catch (error: any) {
    console.error('SEO settings GET error:', error);
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' } as ApiResponse<null>, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['superadmin', 'admin']);
    const body = await request.json();
    const db = await getDb();
    
    // Remove _id from updates to avoid Mongo immutable field error
    const { _id, type, ...updates } = body;

    // Validate inputs (only if they are provided and have content)
    const {
      siteUrl,
      googleAnalyticsId,
      twitterHandle,
      defaultOgImage,
      socialLinks,
      businessPhone,
      businessEmail,
      locations
    } = updates;

    const urlRegex = /^(https?:\/\/)[^\s$.?#].[^\s]*$/i;
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    const twitterRegex = /^@[a-zA-Z0-9_]{1,15}$/;

    if (siteUrl && siteUrl.trim() && !urlRegex.test(siteUrl.trim())) {
      return NextResponse.json({ success: false, error: 'Site URL must be a valid URL starting with http:// or https://' }, { status: 400 });
    }
    if (googleAnalyticsId && googleAnalyticsId.trim()) {
      const ga = googleAnalyticsId.trim().toUpperCase();
      if (!/^(G-[A-Z0-9]+|UA-\d+-\d+)$/.test(ga)) {
        return NextResponse.json({ success: false, error: 'Google Analytics ID format should be G-XXXXXXXXXX or UA-XXXXXX-X' }, { status: 400 });
      }
    }
    if (twitterHandle && twitterHandle.trim()) {
      if (!twitterRegex.test(twitterHandle.trim())) {
        return NextResponse.json({ success: false, error: 'Twitter Creator Handle must start with @ and be alphanumeric (max 15 chars)' }, { status: 400 });
      }
    }
    if (defaultOgImage && defaultOgImage.trim() && !urlRegex.test(defaultOgImage.trim())) {
      return NextResponse.json({ success: false, error: 'Default Open Graph Image must be a valid URL starting with http:// or https://' }, { status: 400 });
    }

    if (socialLinks && Array.isArray(socialLinks)) {
      for (let i = 0; i < socialLinks.length; i++) {
        const link = socialLinks[i];
        const hasPlatform = link.platformName && link.platformName.trim();
        const hasUrl = link.url && link.url.trim();
        if (hasPlatform || hasUrl) {
          if (!hasPlatform) {
            return NextResponse.json({ success: false, error: `Social Profile #${i + 1} Platform Name is required` }, { status: 400 });
          }
          if (!hasUrl) {
            return NextResponse.json({ success: false, error: `Social Profile #${i + 1} URL is required` }, { status: 400 });
          }
          if (!urlRegex.test(link.url.trim())) {
            return NextResponse.json({ success: false, error: `Social Profile #${i + 1} URL must be a valid URL` }, { status: 400 });
          }
        }
      }
    }

    if (businessPhone && businessPhone.trim() && !phoneRegex.test(businessPhone.trim())) {
      return NextResponse.json({ success: false, error: 'Business Contact Phone must be a valid phone number' }, { status: 400 });
    }
    if (businessEmail && businessEmail.trim() && !emailRegex.test(businessEmail.trim())) {
      return NextResponse.json({ success: false, error: 'Business Inquiry Email must be a valid email format' }, { status: 400 });
    }

    if (locations && Array.isArray(locations)) {
      for (let i = 0; i < locations.length; i++) {
        const loc = locations[i];
        const hasAnyField = 
          (loc.locationName && loc.locationName.trim()) ||
          (loc.phone && loc.phone.trim()) ||
          (loc.hours && loc.hours.trim()) ||
          (loc.address && loc.address.trim()) ||
          (loc.city && loc.city.trim()) ||
          (loc.zip && loc.zip.trim());

        if (hasAnyField) {
          if (!loc.locationName || !loc.locationName.trim()) {
            return NextResponse.json({ success: false, error: `Location #${i + 1} Tag Name is required` }, { status: 400 });
          }
          if (loc.phone && loc.phone.trim() && !phoneRegex.test(loc.phone.trim())) {
            return NextResponse.json({ success: false, error: `Location #${i + 1} Phone must be a valid phone number` }, { status: 400 });
          }
          if (!loc.address || !loc.address.trim()) {
            return NextResponse.json({ success: false, error: `Location #${i + 1} Street Address is required` }, { status: 400 });
          }
          if (!loc.city || !loc.city.trim()) {
            return NextResponse.json({ success: false, error: `Location #${i + 1} City is required` }, { status: 400 });
          }
          if (!loc.zip || !loc.zip.trim()) {
            return NextResponse.json({ success: false, error: `Location #${i + 1} Postal Code is required` }, { status: 400 });
          }
        }
      }
    }
    
    const result = await db.collection('seo_global').findOneAndUpdate(
      { type: 'global' },
      { 
        $set: {
          ...updates,
          updated_at: new Date().toISOString()
        } 
      },
      { returnDocument: 'after', upsert: true }
    );
    
    return NextResponse.json({ 
      success: true, 
      message: 'SEO settings updated successfully', 
      data: result 
    } as ApiResponse<any>, { status: 200 });
  } catch (error: any) {
    console.error('SEO settings POST error:', error);
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' } as ApiResponse<null>, { status });
  }
}
