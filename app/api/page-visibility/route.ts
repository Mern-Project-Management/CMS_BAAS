import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Page visibility configuration
const PAGE_ROUTES: Record<string, string> = {
  'home-02': '/',
  'about-us': '/about-us',
  'blogs': '/blogs',
  'careers': '/careers',
  'contact': '/contact',
  'events': '/events',
  'downloads': '/downloads',
  'global-presence': '/global-presence',
  'industry-solutions': '/industry-solutions',
  'manufacturing-infrastructure': '/manufacturing-infrastructure',
  'products': '/products',
  'quality-certification': '/quality-certification',
  'services': '/services',
  'terms-and-conditions': '/terms-and-conditions',
};

// GET /api/page-visibility - Get all pages with their visibility status
export async function GET(request: NextRequest) {
  try {
    const db = await getDb();
    const col = db.collection('page_visibility');

    const docs = await col.find({}).toArray();
    const visibilityMap = new Map(docs.map((d: any) => [d.page_key, d.is_hidden]));

    const pages = Object.entries(PAGE_ROUTES).map(([key, path]) => ({
      key,
      path,
      is_hidden: visibilityMap.get(key) || false,
    }));

    return NextResponse.json({ success: true, data: pages });
  } catch (err) {
    console.error('page-visibility GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/page-visibility - Update page visibility
// Body: { page_key: string, is_hidden: boolean }
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { page_key, is_hidden } = body as { page_key: string; is_hidden: boolean };

    if (!page_key || typeof is_hidden !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'page_key and is_hidden are required' },
        { status: 400 }
      );
    }

    if (!PAGE_ROUTES[page_key]) {
      return NextResponse.json(
        { success: false, error: 'Invalid page_key' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const col = db.collection('page_visibility');
    const now = new Date().toISOString();

    await col.updateOne(
      { page_key },
      { $set: { is_hidden, updated_at: now } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, data: { page_key, is_hidden } });
  } catch (err) {
    console.error('page-visibility PUT error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
