import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createCollection, createField } from '@/lib/db';
import type { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    await requireRole(['superadmin', 'admin']);

    // 1. Define standard schemas to seed
    const defaultSchemas = [
      {
        collection: {
          name: 'our_products',
          display_name: 'Products',
          description: 'E-commerce catalog products',
          icon: 'lucide:shopping-bag',
          color: 'teal',
        },
        fields: [
          { name: 'title', display_name: 'Title', field_type: 'Text', is_required: true, field_order: 1 },
          { name: 'slug', display_name: 'Slug', field_type: 'Text', is_required: true, is_unique: true, field_order: 2 },
          { name: 'price', display_name: 'Price', field_type: 'Text', field_order: 3 },
          { name: 'category', display_name: 'Category', field_type: 'Text', field_order: 4 },
          { name: 'description', display_name: 'Description', field_type: 'Textarea', field_order: 5 },
          { name: 'image', display_name: 'Product Image', field_type: 'Image', field_order: 6 },
          { name: 'canonical_link', display_name: 'Canonical Link', field_type: 'Text', field_order: 7 },
        ]
      },
      {
        collection: {
          name: 'blog',
          display_name: 'Blogs',
          description: 'Articles, news, and releases',
          icon: 'lucide:book-open',
          color: 'blue',
        },
        fields: [
          { name: 'title', display_name: 'Title', field_type: 'Text', is_required: true, field_order: 1 },
          { name: 'slug', display_name: 'Slug', field_type: 'Text', is_required: true, is_unique: true, field_order: 2 },
          { name: 'author', display_name: 'Author', field_type: 'Text', field_order: 3 },
          { name: 'date', display_name: 'Date Published', field_type: 'Text', field_order: 4 },
          { name: 'details', display_name: 'Details / Content', field_type: 'RichText', field_order: 5 },
          { name: 'image', display_name: 'Cover Image', field_type: 'Image', field_order: 6 },
          { name: 'canonical_link', display_name: 'Canonical Link', field_type: 'Text', field_order: 7 },
        ]
      },
      {
        collection: {
          name: 'faq',
          display_name: 'FAQs',
          description: 'Frequently Asked Questions mapping',
          icon: 'lucide:help-circle',
          color: 'indigo',
        },
        fields: [
          { name: 'question', display_name: 'Question', field_type: 'Text', is_required: true, field_order: 1 },
          { name: 'ans', display_name: 'Answer', field_type: 'Textarea', is_required: true, field_order: 2 },
          { name: 'page', display_name: 'Target Page Path', field_type: 'Text', is_required: true, field_order: 3 },
        ]
      },
      {
        collection: {
          name: 'manage-meta',
          display_name: 'Page Metadata',
          description: 'Global SEO rules, titles, and tags',
          icon: 'lucide:settings',
          color: 'emerald',
        },
        fields: [
          { name: 'slug', display_name: 'Page Slug / Route', field_type: 'Text', is_required: true, is_unique: true, field_order: 1 },
          { name: 'meta_title', display_name: 'Meta Title', field_type: 'Text', field_order: 2 },
          { name: 'meta_description', display_name: 'Meta Description', field_type: 'Textarea', field_order: 3 },
          { name: 'keywords', display_name: 'Meta Keywords', field_type: 'Text', field_order: 4 },
          { name: 'json_ld', display_name: 'JSON-LD Schema Markup', field_type: 'Textarea', field_order: 5 },
          { name: 'canonical_link', display_name: 'Canonical Link', field_type: 'Text', field_order: 6 },
        ]
      }
    ];

    // 2. Perform Seeding
    for (const schema of defaultSchemas) {
      // Check if collection already exists, if so skip it
      const { data: createdCol, error: colError } = await createCollection(schema.collection);
      if (colError || !createdCol) {
        console.log(`Skipping seeding of ${schema.collection.name} as it may already exist.`);
        continue;
      }

      // Add fields to the newly created collection
      for (const field of schema.fields) {
        await createField({
          collection_id: createdCol.id,
          ...field,
        } as any);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Default collections and schemas installed successfully' 
    } as ApiResponse<any>, { status: 200 });

  } catch (error: any) {
    console.error('Setup Seeder POST Error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' } as ApiResponse<null>, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' } as ApiResponse<null>, { status: 500 });
  }
}
