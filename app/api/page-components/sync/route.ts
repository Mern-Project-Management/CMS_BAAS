import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Label corrections — source of truth from the bexon page comments
const LABEL_CORRECTIONS: Record<string, Record<string, string>> = {
  'home-02': {
    'Hero Banner': 'Hero Banner',
    'About': 'About',
    'Category': 'Category',
    'popular_products': 'popular_products',
    'Clients': 'Clients',
    'Global Presence': 'Global Presence',
    'testimonials': 'testimonials',
    'cta_form': 'cta_form',
    'FAQ': 'FAQ',
  },
  'about-us': {
    About9: 'Company Overview',
    mossion_vision: 'Our Mission & Vision',
    "core-value": 'Core Value',
    Cta: 'CTA',
  },
  'blogs': {
    BlogsGridISR: 'Blogs Grid',
  },
  'contact': {
    ContactTop: 'Contact Top',
    Contact3: 'Contact Form',
    Cta: 'CTA',
  },
  'downloads': {
    DownloadCenter: 'Download Center',
  },
  'products': {
    CategoriesGrid: 'Products Grid',
    Cta: 'CTA',
  },
  'terms-and-conditions': {
    TermsAndConditionsPrimary: 'Terms and Conditions Text',
    Cta: 'CTA',
  },
  'our-capabilities': {
    OurStrength: 'Our Strength',
    OurServices: 'Our Services',
    Process: 'Process',
  },
  'categories': {
    CategoriesGrid: 'Categories Grid',
  },
};

const MIGRATIONS = [
  { page: 'home-02', oldKey: 'Hero2', newKey: 'Hero Banner', newLabel: 'Hero Banner' },
  { page: 'home-02', oldKey: 'About9', newKey: 'About', newLabel: 'About' },
  { page: 'home-02', oldKey: 'Services9Wrapper', newKey: 'Category', newLabel: 'Category' },
  { page: 'home-02', oldKey: 'Portfolios6Wrapper', newKey: 'popular_products', newLabel: 'popular_products' },
  { page: 'home-02', oldKey: 'Brands4', newKey: 'Clients', newLabel: 'Clients' },
  { page: 'home-02', oldKey: 'Contact2', newKey: 'Global Presence', newLabel: 'Global Presence' },
  { page: 'home-02', oldKey: 'Testimonials6', newKey: 'testimonials', newLabel: 'testimonials' },
  { page: 'home-02', oldKey: 'Testimonials4', newKey: 'cta_form', newLabel: 'cta_form' },
  { page: 'home-02', oldKey: 'Faq1', newKey: 'FAQ', newLabel: 'FAQ' },
];

// POST /api/page-components/sync
// Force-updates labels in MongoDB to match the source-of-truth above.
// Call this once after changing label definitions.
export async function POST() {
  try {
    const db = await getDb();
    const col = db.collection('page_components');
    const now = new Date().toISOString();

    // Clean up deleted keys from database configuration records
    const deleteResult = await col.deleteMany({
      key: { $in: ['Portfolios5', 'Services3', 'Team1', 'Team2', 'Services4', 'Features', 'Process'] }
    });
    console.log(`[Sync] Cleaned up ${deleteResult.deletedCount} database page component records.`);

    const ops: any[] = [];

    // 1. Run migrations to update old keys to new keys and labels
    for (const mig of MIGRATIONS) {
      ops.push({
        updateOne: {
          filter: { page: mig.page, key: mig.oldKey },
          update: { $set: { key: mig.newKey, label: mig.newLabel, updated_at: now } }
        }
      });
    }

    // 2. Add updates for all current label corrections
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
      message: `Synced labels and migrated keys. Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}. Deleted obsolete components: ${deleteResult.deletedCount}`,
    });
  } catch (err) {
    console.error('page-components sync error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
