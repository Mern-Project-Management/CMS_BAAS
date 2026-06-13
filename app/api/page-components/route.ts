import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Default component definitions per page
// When no DB record exists, these are the defaults (all active)
const PAGE_DEFAULTS: Record<string, Array<{ key: string; label: string; order: number }>> = {
  'home-02': [
    { key: 'Hero2',              label: 'Hero Banner',    order: 1  },
    { key: 'About9',             label: 'About',          order: 2  },
    { key: 'Portfolios5',        label: 'Category',       order: 3  },
    { key: 'Services9Wrapper',   label: 'Service',        order: 4  },
    { key: 'Services3',          label: 'Why Choose Us',  order: 5  },
    { key: 'Portfolios6Wrapper', label: 'industry',       order: 6  },
    { key: 'Brands4',            label: 'Clients',        order: 7  },
    { key: 'Contact2',           label: 'Global Presence', order: 8 },
    { key: 'Team1',              label: 'cirtificate',    order: 9  },
    { key: 'Testimonials6',      label: 'testimonials',   order: 10 },
    { key: 'Testimonials4',      label: 'cta',            order: 11 },
  ],
  'about-us': [
    { key: 'About9',     label: 'Company Overview',   order: 1 },
    { key: 'Features',   label: 'Our Mission & Vision', order: 2 },
    { key: 'Process',    label: 'Our History',         order: 3 },
    { key: 'Team2',      label: 'Leadership Team',     order: 4 },
    { key: 'Services4',  label: 'Infrastructure',      order: 5 },
    { key: 'Team1',      label: 'Certificates',        order: 6 },
    { key: 'Services3',  label: 'Why Choose Us',       order: 7 },
    { key: 'Cta',        label: 'CTA',                 order: 8 },
  ],
  'blogs': [
    { key: 'BlogsGridISR', label: 'Blogs Grid', order: 1 },
  ],
  'careers': [
    { key: 'Careers1', label: 'Careers List', order: 1 },
    { key: 'Cta',      label: 'CTA',          order: 2 },
  ],
  'contact': [
    { key: 'ContactTop', label: 'Contact Top', order: 1 },
    { key: 'Contact3',   label: 'Contact Form', order: 2 },
    { key: 'Cta',        label: 'CTA',          order: 3 },
  ],
  'faq': [
    { key: 'Faq2', label: 'FAQ Accordion 1', order: 1 },
    { key: 'Faq3', label: 'FAQ Accordion 2', order: 2 },
    { key: 'Cta',  label: 'CTA',             order: 3 },
  ],
  'global-presence': [
    { key: 'Contact2',  label: 'Contact Section', order: 1 },
    { key: 'Team3',     label: 'Our Team', order: 2 },
    { key: 'Team1',     label: 'Certificates', order: 3 },
  ],
  'industry-solutions': [
    { key: 'Services10',   label: 'Our Solutions', order: 1 },
    { key: 'Portfolios10', label: 'Latest Projects', order: 2 },
  ],
  'manufacturing-infrastructure': [
    { key: 'Portfolios4',          label: 'Machinery & Equipment', order: 1 },
    { key: 'ManufacturingProcess', label: 'Manufacturing Process', order: 2 },
    { key: 'Services5',            label: 'Quality Control Process', order: 3 },
    { key: 'About6',               label: 'Production Capacity', order: 4 },
    { key: 'Portfolios1',          label: 'Factory Images', order: 5 },
    { key: 'Services8',            label: 'Safety Standards', order: 6 },
  ],
  'products': [
    { key: 'PortfoliosPrimary', label: 'Products Grid', order: 1 },
    { key: 'Cta',               label: 'CTA', order: 2 },
  ],
  'quality-certification': [
    { key: 'Features', label: 'Our Mission & Vision', order: 1 },
    { key: 'Process2', label: 'Our Process', order: 2 },
    { key: 'Team1',    label: 'Certificates', order: 3 },
  ],
  'services': [
    { key: 'ServicesPrimary', label: 'Services Grid', order: 1 },
    { key: 'Cta',             label: 'CTA', order: 2 },
  ],
  'team': [
    { key: 'Team1', label: 'Team Grid', order: 1 },
    { key: 'Cta',   label: 'CTA', order: 2 },
  ],
  'terms-and-conditions': [
    { key: 'TermsAndConditionsPrimary', label: 'Terms and Conditions Text', order: 1 },
    { key: 'Cta',                       label: 'CTA', order: 2 },
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
