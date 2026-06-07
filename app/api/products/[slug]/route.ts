import { NextRequest, NextResponse } from 'next/server';
import {
  getDb,
  normalizeDocId,
  oid,
  getCollectionByName,
  getCollectionFields,
} from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await requireAuth();
    const { slug } = await context.params;
    const db = await getDb();

    // 1. Get collection config and fields
    const { data: collection } = await getCollectionByName('our_products');
    if (!collection) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product collection not found' 
      }, { status: 404 });
    }

    const { data: fields } = await getCollectionFields(collection.id);

    // 2. Find product by slug
    const product = await db.collection('our_products')
      .findOne({ 
        slug: slug 
      });

    if (!product) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product not found' 
      }, { status: 404 });
    }

    const normalized = normalizeDocId(product);

    // 3. Populate all relation fields (category, industry, etc.)
    const relationFields = (fields || []).filter(f => 
      f.field_type === 'Relation' && 
      f.relation_to_collection
    );

    for (const field of relationFields) {
      const val = normalized[field.name];
      if (val) {
        try {
          const targetOid = oid(val);
          const relatedDoc = await db.collection(field.relation_to_collection!).findOne({
            $or: [{ _id: targetOid }, { _id: val }]
          });

          if (relatedDoc) {
            normalized[`${field.name}_populated`] = normalizeDocId(relatedDoc);
          }
        } catch (e) {
          console.warn(`Failed to populate ${field.name}:`, e);
        }
      }
    }

    console.log(`Product found: ${normalized.name} (${slug})`);

    return NextResponse.json({ 
      success: true, 
      data: normalized 
    });

  } catch (error: any) {
    console.error("Error in GET /api/products/[slug]:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}