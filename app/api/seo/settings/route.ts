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
