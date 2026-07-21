import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Default component definitions per page
// When no DB record exists, these are the defaults (all active)
const PAGE_DEFAULTS: Record<string, Array<{ key: string; label: string; order: number }>> = {
  'home-02': [
    { key: 'Hero Banner', label: 'Hero Banner', order: 1 },
    { key: 'About', label: 'About', order: 2 },
    { key: 'Category', label: 'Category', order: 3 },
    { key: 'popular_products', label: 'popular_products', order: 4 },
    { key: 'Clients', label: 'Clients', order: 5 },
    { key: 'Global Presence', label: 'Global Presence', order: 6 },
    { key: 'testimonials', label: 'testimonials', order: 7 },
    { key: 'cta_form', label: 'cta_form', order: 8 },
    { key: 'FAQ', label: 'FAQ', order: 9 },
  ],
  'about-us': [
    { key: 'About9', label: 'Company Overview', order: 1 },
    { key: 'mossion_vision', label: 'Our Mission & Vision', order: 2 },
    { key: 'core-value', label: 'Core Value', order: 3 },
    { key: 'Cta', label: 'CTA', order: 4 },
  ],
  'blogs': [
    { key: 'BlogsGridISR', label: 'Blogs Grid', order: 1 },
  ],
  'contact': [
    { key: 'ContactTop', label: 'Contact Top', order: 1 },
    { key: 'Contact3', label: 'Contact Form', order: 2 },
    { key: 'Cta', label: 'CTA', order: 3 },
  ],
  'downloads': [
    { key: 'DownloadCenter', label: 'Download Center', order: 1 },
  ],


  'products': [
    { key: 'CategoriesGrid', label: 'Products Grid', order: 1 },
    { key: 'Cta', label: 'CTA', order: 2 },
  ],

  'terms-and-conditions': [
    { key: 'TermsAndConditionsPrimary', label: 'Terms and Conditions Text', order: 1 },
    { key: 'Cta', label: 'CTA', order: 2 },
  ],
  'our-capabilities': [
    { key: 'OurStrength', label: 'Our Strength', order: 1 },
    { key: 'OurServices', label: 'Our Services', order: 2 },
    { key: 'Process', label: 'Process', order: 3 },
  ],
  'categories': [
    { key: 'CategoriesGrid', label: 'Categories Grid', order: 1 },
  ],
};

// ── GET /api/page-components?page=home-02 ─────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');

    const db = await getDb();
    const col = db.collection('page_components');

    if (page) {
      // Return components for a specific page
      const docs = await col.find({ page }).sort({ order: 1 }).toArray();

      if (docs.length === 0) {
        // Seed defaults on first access
        const defaults = PAGE_DEFAULTS[page];
        if (defaults) {
          const now = new Date().toISOString();
          const toInsert = defaults.map((d) => ({
            page,
            key: d.key,
            label: d.label,
            order: d.order,
            is_active: true,
            margin_top: '',
            margin_bottom: '',
            padding_top: '',
            padding_bottom: '',
            created_at: now,
            updated_at: now,
          }));
          await col.insertMany(toInsert);
          const inserted = await col.find({ page }).sort({ order: 1 }).toArray();
          const data = inserted.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest }));
          return NextResponse.json({ success: true, data });
        }
        return NextResponse.json({ success: true, data: [] });
      }

      const data = docs.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest }));
      return NextResponse.json({ success: true, data });
    }

    // Return all pages summary
    const allDocs = await col.find({}).sort({ page: 1, order: 1 }).toArray();
    const data = allDocs.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest }));
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('page-components GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ── PUT /api/page-components ──────────────────────────────────────────────
// Body: { page, components: [{ key, is_active, order, label }] }
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { page, components } = body as {
      page: string;
      components: Array<{ key: string; is_active: boolean; order: number; label?: string; margin_top?: string; margin_bottom?: string; padding_top?: string; padding_bottom?: string }>;
    };

    if (!page || !Array.isArray(components)) {
      return NextResponse.json(
        { success: false, error: 'page and components array are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const col = db.collection('page_components');
    const now = new Date().toISOString();

    // Upsert each component by page+key
    const ops = components.map((c) => ({
      updateOne: {
        filter: { page, key: c.key },
        update: {
          $set: {
            is_active: c.is_active,
            order: c.order,
            ...(c.label !== undefined ? { label: c.label } : {}),
            ...(c.margin_top !== undefined ? { margin_top: c.margin_top } : {}),
            ...(c.margin_bottom !== undefined ? { margin_bottom: c.margin_bottom } : {}),
            ...(c.padding_top !== undefined ? { padding_top: c.padding_top } : {}),
            ...(c.padding_bottom !== undefined ? { padding_bottom: c.padding_bottom } : {}),
            updated_at: now,
          },
          $setOnInsert: { page, key: c.key, created_at: now },
        },
        upsert: true,
      },
    }));

    await col.bulkWrite(ops);

    const updated = await col.find({ page }).sort({ order: 1 }).toArray();
    const data = updated.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest }));

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('page-components PUT error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
