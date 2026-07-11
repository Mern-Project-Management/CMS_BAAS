import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createCollection, createField, getCollections } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await requireRole(['superadmin']);

    // Check if any collections already exist to avoid seeding duplicates
    const check = await getCollections();
    if (check.data && check.data.length > 0) {
      return NextResponse.json({ success: false, error: 'Database is already seeded or collections exist.' }, { status: 400 });
    }

    // 1. Seed 'our_products' Collection
    const productCol = await createCollection({
      name: 'our_products',
      display_name: 'Our Products',
      description: 'List of company products and manufacturing items',
      icon: 'lucide:Package',
      color: '#3b82f6',
    });

    if (productCol.data?.id) {
      const pid = productCol.data.id;
      await createField({ collection_id: pid, name: 'title', display_name: 'Title', field_type: 'Text', is_required: true, field_order: 1 });
      await createField({ collection_id: pid, name: 'slug', display_name: 'Slug', field_type: 'Text', is_required: true, is_unique: true, field_order: 2 });
      await createField({ collection_id: pid, name: 'description', display_name: 'Description', field_type: 'Textarea', field_order: 3 });
      await createField({ collection_id: pid, name: 'image', display_name: 'Product Image', field_type: 'Image', field_order: 4 });
      await createField({ collection_id: pid, name: 'price', display_name: 'Price', field_type: 'Number', field_order: 5 });
    }

    // 2. Seed 'blog' Collection
    const blogCol = await createCollection({
      name: 'blog',
      display_name: 'Blog Posts',
      description: 'News, articles, and updates',
      icon: 'lucide:FileText',
      color: '#10b981',
    });

    if (blogCol.data?.id) {
      const bid = blogCol.data.id;
      await createField({ collection_id: bid, name: 'title', display_name: 'Title', field_type: 'Text', is_required: true, field_order: 1 });
      await createField({ collection_id: bid, name: 'slug', display_name: 'Slug', field_type: 'Text', is_required: true, is_unique: true, field_order: 2 });
      await createField({ collection_id: bid, name: 'content', display_name: 'Content', field_type: 'Editor', field_order: 3 });
      await createField({ collection_id: bid, name: 'thumbnail', display_name: 'Thumbnail', field_type: 'Image', field_order: 4 });
      await createField({ collection_id: bid, name: 'publish_date', display_name: 'Publish Date', field_type: 'Date', field_order: 5 });
    }

    // 3. Seed 'faq' Collection
    const faqCol = await createCollection({
      name: 'faq',
      display_name: 'FAQ',
      description: 'Frequently Asked Questions',
      icon: 'lucide:HelpCircle',
      color: '#f59e0b',
    });

    if (faqCol.data?.id) {
      const fid = faqCol.data.id;
      await createField({ collection_id: fid, name: 'question', display_name: 'Question', field_type: 'Text', is_required: true, field_order: 1 });
      await createField({ collection_id: fid, name: 'answer', display_name: 'Answer', field_type: 'Textarea', is_required: true, field_order: 2 });
    }

    // 4. Seed 'manage-meta' Collection
    const metaCol = await createCollection({
      name: 'manage-meta',
      display_name: 'Page Meta Rules',
      description: 'Manage SEO page titles, descriptions and JSON-LD schema',
      icon: 'lucide:Search',
      color: '#8b5cf6',
    });

    if (metaCol.data?.id) {
      const mid = metaCol.data.id;
      await createField({ collection_id: mid, name: 'slug', display_name: 'Page Route', field_type: 'PageRoute', is_required: true, is_unique: true, field_order: 1 });
      await createField({ collection_id: mid, name: 'meta_title', display_name: 'Meta Title', field_type: 'Text', field_order: 2 });
      await createField({ collection_id: mid, name: 'meta_description', display_name: 'Meta Description', field_type: 'Textarea', field_order: 3 });
      await createField({ collection_id: mid, name: 'keywords', display_name: 'Keywords', field_type: 'Text', field_order: 4 });
      await createField({ collection_id: mid, name: 'schema', display_name: 'Schema Markup (JSON)', field_type: 'JSON', field_order: 5 });
    }

    // Force sidebar refresh
    return NextResponse.json({ success: true, message: 'Default packages and tables installed successfully.' });
  } catch (error: any) {
    console.error('Seed Defaults Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to seed defaults' }, { status: 500 });
  }
}
