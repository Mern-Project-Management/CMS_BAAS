import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json({ success: false, error: 'url parameter is required' } as ApiResponse<null>, { status: 400 });
    }
    
    const db = await getDb();
    
    // Normalize url query parameter to search (e.g. ensure starts with / if relative path)
    let searchUrl = url.trim();
    if (!searchUrl.startsWith('http') && !searchUrl.startsWith('/')) {
      searchUrl = `/${searchUrl}`;
    }
    
    // Find active redirect
    const redirect = await db.collection('seo_redirects').findOne({
      sourceUrl: searchUrl,
      status: 'Active'
    });
    
    // Fallback search with trailing slash normalized (if /about matches /about/ or vice versa)
    let altRedirect = null;
    if (!redirect) {
      let alternativeUrl = '';
      if (searchUrl.endsWith('/') && searchUrl.length > 1) {
        alternativeUrl = searchUrl.slice(0, -1);
      } else if (!searchUrl.endsWith('/')) {
        alternativeUrl = `${searchUrl}/`;
      }
      
      if (alternativeUrl) {
        altRedirect = await db.collection('seo_redirects').findOne({
          sourceUrl: alternativeUrl,
          status: 'Active'
        });
      }
    }
    
    const matched = redirect || altRedirect;
    
    if (!matched) {
      return NextResponse.json({ success: false, message: 'No active redirect found' } as ApiResponse<null>, { status: 200 });
    }
    
    // Increment hit count asynchronously
    db.collection('seo_redirects').updateOne(
      { _id: matched._id },
      { $inc: { hits: 1 } }
    ).catch(err => console.error('Failed to increment redirect hits:', err));
    
    return NextResponse.json({
      success: true,
      data: {
        sourceUrl: matched.sourceUrl,
        targetUrl: matched.targetUrl,
        statusCode: matched.statusCode ?? 301
      }
    } as ApiResponse<any>, { status: 200 });
  } catch (error: any) {
    console.error('Redirect resolution error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' } as ApiResponse<null>, { status: 500 });
  }
}
