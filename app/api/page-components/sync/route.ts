import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Label corrections — source of truth from the bexon page comments
const LABEL_CORRECTIONS: Record<string, Record<string, string>> = {
  'home-02': {
    Hero2:              'Hero Banner',
    About9:             'About',
    Portfolios5:        'Category',
    Services9Wrapper:   'Service',
    Services3:          'Why Choose Us',
    Portfolios6Wrapper: 'industry',
    Brands4:            'Clients',
    Contact2:           'Global Presence',
    Team1:              'cirtificate',
    Testimonials6:      'testimonials',
    Testimonials4:      'cta',
  },
  'about-us': {
    HeroInner:  'Page Header',
    About9:     'Company Overview',
    Features:   'Our Mission & Vision',
    Process:    'Our History',
    Team2:      'Leadership Team',
    Services4:  'Infrastructure',
    Team1:      'cirtificate',
    Services3:  'Why Choose Us',
    Cta:        'CTA',
  },
};

// POST /api/page-components/sync
// Force-updates labels in MongoDB to match the source-of-truth above.
// Call this once after changing label definitions.
export async function POST() {
  try {
    const db = await getDb();
    const col = db.collection('page_components');
    const now = new Date().toISOString();

    const ops: any[] = [];

    for (const [page, keys] of Object.entries(LABEL_CORRECTIONS)) {
      for (const [key, label] of Object.entries(keys)) {
        ops.push({
          updateOne: {
            filter: { page, key },
            update: { $set: { label, updated_at: now } },
          },
        });
      }
    }

    if (ops.length === 0) {
      return NextResponse.json({ success: true, message: 'Nothing to sync.' });
    }

    const result = await col.bulkWrite(ops);

    return NextResponse.json({
      success: true,
      message: `Synced labels. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`,
    });
  } catch (err) {
    console.error('page-components sync error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
