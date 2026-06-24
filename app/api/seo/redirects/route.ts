import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

export async function GET() {
  try {
    await requireRole(['superadmin', 'admin']);
    const db = await getDb();
    const redirects = await db.collection('seo_redirects').find().sort({ created_at: -1 }).toArray();
    
    // Normalize MongoDB _id to string id
    const data = redirects.map(r => ({
      id: r._id.toString(),
      sourceUrl: r.sourceUrl,
      targetUrl: r.targetUrl,
      statusCode: r.statusCode ?? 301,
      status: r.status ?? 'Active',
      hits: r.hits ?? 0,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));
    
    return NextResponse.json({ success: true, data } as ApiResponse<typeof data>, { status: 200 });
  } catch (error: any) {
    console.error('Redirects GET error:', error);
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' } as ApiResponse<null>, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['superadmin', 'admin']);
    const body = await request.json();
    const { sourceUrl, targetUrl, statusCode, status } = body;
    
    if (!sourceUrl || !targetUrl) {
      return NextResponse.json({ success: false, error: 'Source URL and Target URL are required' } as ApiResponse<null>, { status: 400 });
    }
    
    // Normalize URLs to start with / if they are relative paths
    const formattedSource = sourceUrl.startsWith('/') || sourceUrl.startsWith('http') ? sourceUrl.trim() : `/${sourceUrl.trim()}`;
    const formattedTarget = targetUrl.startsWith('/') || targetUrl.startsWith('http') ? targetUrl.trim() : `/${targetUrl.trim()}`;
    
    const db = await getDb();
    
    // Enforce uniqueness on sourceUrl
    const existing = await db.collection('seo_redirects').findOne({ sourceUrl: formattedSource });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Source URL already exists' } as ApiResponse<null>, { status: 400 });
    }
    
    const newRedirect = {
      sourceUrl: formattedSource,
      targetUrl: formattedTarget,
      statusCode: Number(statusCode || 301),
      status: status || 'Active',
      hits: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const result = await db.collection('seo_redirects').insertOne(newRedirect);
    
    return NextResponse.json({
      success: true,
      message: 'Redirect created successfully',
      data: { id: result.insertedId.toString(), ...newRedirect }
    } as ApiResponse<any>, { status: 201 });
  } catch (error: any) {
    console.error('Redirects POST error:', error);
    const status = error.message === 'Unauthorized' ? 401 : error.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' } as ApiResponse<null>, { status });
  }
}
