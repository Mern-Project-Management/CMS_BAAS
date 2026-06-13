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
    About9:     'Company Overview',
    Features:   'Our Mission & Vision',
    Process:    'Our History',
    Team2:      'Leadership Team',
    Services4:  'Infrastructure',
    Team1:      'Certificates',
    Services3:  'Why Choose Us',
    Cta:        'CTA',
  },
  'blogs': {
    BlogsGridISR: 'Blogs Grid',
  },
  'careers': {
    Careers1: 'Careers List',
    Cta:      'CTA',
  },
  'contact': {
    ContactTop: 'Contact Top',
    Contact3:   'Contact Form',
    Cta:        'CTA',
  },
  'faq': {
    Faq2: 'FAQ Accordion 1',
    Faq3: 'FAQ Accordion 2',
    Cta:  'CTA',
  },
  'global-presence': {
    Contact2:  'Contact Section',
    Team3:     'Our Team',
    Team1:     'Certificates',
  },
  'industry-solutions': {
    Services10:   'Our Solutions',
    Portfolios10: 'Latest Projects',
  },
  'manufacturing-infrastructure': {
    Portfolios4:          'Machinery & Equipment',
    ManufacturingProcess: 'Manufacturing Process',
    Services5:            'Quality Control Process',
    About6:               'Production Capacity',
    Portfolios1:          'Factory Images',
    Services8:            'Safety Standards',
  },
  'products': {
    PortfoliosPrimary: 'Products Grid',
    Cta:               'CTA',
  },
  'quality-certification': {
    Features: 'Our Mission & Vision',
    Process2: 'Our Process',
    Team1:    'Certificates',
  },
  'services': {
    ServicesPrimary: 'Services Grid',
    Cta:             'CTA',
  },
  'team': {
    Team1: 'Team Grid',
    Cta:   'CTA',
  },
  'terms-and-conditions': {
    TermsAndConditionsPrimary: 'Terms and Conditions Text',
    Cta:                       'CTA',
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
