import { NextRequest, NextResponse } from 'next/server';
import { 
  getCollection, 
  getCollectionByName, 
  getRecords, 
  populateRelationLabels, 
  getCollectionFields,
  getDb,
  normalizeDocId,
  oid
} from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    // await requireAuth();
    const { collectionId } = await params;

    // 1. Resolve the collection name
    let { data: collection } = await getCollection(collectionId);
    
    // If not found by ID, try finding by name (slug)
    if (!collection) {
      const { data: byName } = await getCollectionByName(collectionId);
      collection = byName;
    }

    if (!collection) {
      return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 });
    }

    // 2. Extract filters from Query Parameters
    // Example: ?category_id=123 becomes { category_id: "123" }
    const searchParams = request.nextUrl.searchParams;
    const filters: Record<string, any> = {};
    
    searchParams.forEach((value, key) => {
      if (key !== 'limit' && key !== 'offset') {
        filters[key] = value;
      }
    });

    // 3. Fetch data with filters
    const limit = parseInt(searchParams.get('limit') || '100');
    const { data: records } = await getRecords(collection.name, limit, filters);

    // 4. Populate relational fields with full objects and labels
    const db = await getDb();
    const { data: fields } = await getCollectionFields(collection.id);
    const basePopulated = await populateRelationLabels(records || [], fields || []);

    const populatedRecords = await Promise.all((basePopulated || []).map(async (record: any) => {
      for (const field of (fields || [])) {
        if (field.field_type === 'Relation' && field.relation_to_collection && record[field.name]) {
          try {
            const targetOid = oid(record[field.name]);
            if (targetOid) {
              const relatedDoc = await db.collection(field.relation_to_collection).findOne({ _id: targetOid });
              if (relatedDoc) {
                const populated = normalizeDocId(relatedDoc);
                
                // Deep population for hierarchy (self-relations)
                // This allows seeing grandparent info for Sub-Sub-Children
                if (field.relation_to_collection === collection.name && populated[field.name]) {
                  const gpOid = oid(populated[field.name]);
                  if (gpOid) {
                    const gpDoc = await db.collection(field.relation_to_collection).findOne({ _id: gpOid });
                    if (gpDoc) {
                      populated[`${field.name}_populated`] = normalizeDocId(gpDoc);
                    }
                  }
                }
                
                record[`${field.name}_populated`] = populated;
              }
            }
          } catch (e) {}
        }
      }
      return record;
    }));

    return NextResponse.json({
      success: true,
      data: populatedRecords,
    } as ApiResponse<any>, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    await requireAuth();
    const { collectionId } = await params;

    // 1. Resolve the collection name
    let { data: collection } = await getCollection(collectionId);
    
    if (!collection) {
      const { data: byName } = await getCollectionByName(collectionId);
      collection = byName;
    }

    if (!collection) {
      return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 });
    }

    // 2. Parse request body
    const body = await request.json();
    const db = await getDb();
    
    // 3. Insert record with timestamps
    const now = new Date().toISOString();
    const doc = {
      ...body,
      created_at: now,
      updated_at: now,
    };

    const result = await db.collection(collection.name).insertOne(doc);
    const normalizedRecord: any = normalizeDocId({ ...doc, _id: result.insertedId });

    // Populate relational data for the response
    const { data: fields } = await getCollectionFields(collection.id);
    for (const field of (fields || [])) {
      if (field.field_type === 'Relation' && field.relation_to_collection && normalizedRecord[field.name]) {
        try {
          const targetOid = oid(normalizedRecord[field.name]);
          if (targetOid) {
            const relatedDoc = await db.collection(field.relation_to_collection).findOne({ _id: targetOid });
            if (relatedDoc) {
              const populated = normalizeDocId(relatedDoc);
              
              // Deep population for hierarchy (self-relations)
              if (field.relation_to_collection === collection.name && populated[field.name]) {
                const gpOid = oid(populated[field.name]);
                if (gpOid) {
                  const gpDoc = await db.collection(field.relation_to_collection).findOne({ _id: gpOid });
                  if (gpDoc) {
                    populated[`${field.name}_populated`] = normalizeDocId(gpDoc);
                  }
                }
              }
              
              normalizedRecord[`${field.name}_populated`] = populated;
            }
          }
        } catch (e) {}
      }
    }

    return NextResponse.json({
      success: true,
      data: normalizedRecord,
    } as ApiResponse<any>, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}