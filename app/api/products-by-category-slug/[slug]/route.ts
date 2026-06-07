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

    // 1. Find the category document
    const categoryDoc = await db.collection('categories').findOne({ 
      category_slug: slug 
    });

    if (!categoryDoc) {
      return NextResponse.json({ 
        success: false, 
        error: 'Category not found' 
      }, { status: 404 });
    }

    // 2. Get collection config and fields
    const { data: collection } = await getCollectionByName('our_products');
    if (!collection) {
      return NextResponse.json({ 
        success: false, 
        error: 'Product collection not found' 
      }, { status: 404 });
    }

    const { data: fields } = await getCollectionFields(collection.id);

    // 3. Try to find category relation field dynamically
    let categoryFieldName = 'category'; // Default fallback based on your document

    const categoryRelationField = (fields || []).find(f => 
      f.field_type === 'Relation' && 
      f.relation_to_collection === 'categories'
    );

    if (categoryRelationField) {
      categoryFieldName = categoryRelationField.name;
      console.log(`Found relation field in metadata: ${categoryFieldName}`);
    } else {
      console.warn(`Category relation not found in metadata. Using fallback field: ${categoryFieldName}`);
      
      // Optional: Log all available fields for debugging
      console.log("Available fields in our_products:", 
        fields?.map(f => ({ 
          name: f.name, 
          type: f.field_type, 
          relationTo: f.relation_to_collection 
        }))
      );
    }

    // 4. Query products using the field
    const products = await db.collection('our_products')
      .find({
        $or: [
          { [categoryFieldName]: categoryDoc._id },
          { [categoryFieldName]: categoryDoc._id.toString() },
          { [categoryFieldName]: { $in: [categoryDoc._id, categoryDoc._id.toString()] } }
        ]
      })
      .sort({ created_at: -1 })
      .toArray();

    console.log(`Found ${products.length} products for category '${slug}'`);

    // 5. Populate other relation fields (Industry, etc.)
    const relationFields = (fields || []).filter(f => 
      f.field_type === 'Relation' && 
      f.relation_to_collection && 
      f.relation_to_collection !== 'categories'
    );

    const populatedProducts = await Promise.all(
      products.map(async (product: any) => {
        const normalized = normalizeDocId(product);

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
        return normalized;
      })
    );

    return NextResponse.json({ 
      success: true, 
      data: populatedProducts 
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