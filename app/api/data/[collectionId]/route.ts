import { NextRequest, NextResponse } from 'next/server';
import { 
  getCollection, 
  getCollectionByName, 
  getRecords, 
  populateRelationLabels, 
  getCollectionFields,
  getDb,
  normalizeDocId,
  oid,
  resolveRelationCollectionName,
} from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import type { ApiResponse, CollectionWithFields } from '@/lib/types';

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    const { collectionId } = await params;

    let collection: CollectionWithFields | null = (await getCollection(collectionId)).data;
    
    if (!collection) {
      const { data: byName } = await getCollectionByName(collectionId);
      collection = byName ? { ...byName, fields: byName.fields || [] } : null;
    }

    if (!collection) {
      return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filters: Record<string, any> = {};
    
    searchParams.forEach((value, key) => {
      if (key !== 'limit' && key !== 'offset' && key !== 'fields') {
        filters[key] = value;
      }
    });

    const fieldsParam = searchParams.get('fields');
    let projection: Record<string, 1> | undefined;
    if (fieldsParam) {
      projection = {};
      for (const f of fieldsParam.split(',').map((s) => s.trim()).filter(Boolean)) {
        projection[f] = 1;
      }
    }

    const limit = parseInt(searchParams.get('limit') || '100');
    const { data: records } = await getRecords(collection.name, limit, filters, projection);

    if (filters.slug && records && records.length > 0) {
      const exactMatch = records.find((r: any) => r.slug === filters.slug);
      if (exactMatch) {
        const db = await getDb();
        const { data: fields } = await getCollectionFields(collection.id);
        const [populated] = await populateRelationLabels([exactMatch], fields || []);
        
        const fullPopulated = await populateRecord(populated, fields || [], collection.name, db);
        
        return NextResponse.json({
          success: true,
          data: [fullPopulated],
        } as ApiResponse<any>, { status: 200 });
      }
    }

    const db = await getDb();
    const { data: fields } = await getCollectionFields(collection.id);
    const basePopulated = await populateRelationLabels(records || [], fields || []);

    const populatedRecords = await Promise.all((basePopulated || []).map(async (record: any) => {
      return await populateRecord(record, fields || [], collection.name, db);
    }));

    return NextResponse.json({
      success: true,
      data: populatedRecords,
    } as ApiResponse<any>, { status: 200 });
  } catch (error: any) {
    console.error('Data GET Error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

async function populateRecord(record: any, fields: any[], collectionName: string, db: any) {
  for (const field of fields) {
    if (field.field_type === 'Relation' && field.relation_to_collection && record[field.name]) {
      try {
        const targetOid = oid(record[field.name]);
        if (!targetOid) continue;

        const targetCollectionName = await resolveRelationCollectionName(field.relation_to_collection);
        if (!targetCollectionName) continue;

        const relatedDoc = await db.collection(targetCollectionName).findOne({ _id: targetOid });
        if (!relatedDoc) continue;

        const populated = normalizeDocId(relatedDoc);

        if (targetCollectionName === collectionName && populated[field.name]) {
          const gpOid = oid(populated[field.name]);
          if (gpOid) {
            const gpCollectionName = await resolveRelationCollectionName(field.relation_to_collection);
            if (gpCollectionName) {
              const gpDoc = await db.collection(gpCollectionName).findOne({ _id: gpOid });
              if (gpDoc) {
                populated[`${field.name}_populated`] = normalizeDocId(gpDoc);
              }
            }
          }
        }

        record[`${field.name}_populated`] = populated;
      } catch (e) {
        // ignore
      }
    }
  }
  return record;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    await requireAuth();
    const { collectionId } = await params;

    let collection: CollectionWithFields | null = (await getCollection(collectionId)).data;
    
    if (!collection) {
      const { data: byName } = await getCollectionByName(collectionId);
      collection = byName ? { ...byName, fields: byName.fields || [] } : null;
    }

    if (!collection) {
      return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 });
    }

    const body = await request.json();
    const db = await getDb();

    if (body.slug && typeof body.slug === 'string') {
      body.slug = slugify(body.slug);
    }

    if (body.slug && typeof body.slug === 'string') {
      const baseSlug = body.slug;
      let uniqueSlug = baseSlug;
      let counter = 1;
      
      while (await db.collection(collection.name).findOne({ slug: uniqueSlug })) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      body.slug = uniqueSlug;
    }

    const now = new Date().toISOString();
    const doc = {
      ...body,
      created_at: now,
      updated_at: now,
    };

    const result = await db.collection(collection.name).insertOne(doc);
    const normalizedRecord: any = normalizeDocId({ ...doc, _id: result.insertedId });

    const { data: fields } = await getCollectionFields(collection.id);
    const fullPopulated = await populateRecord(normalizedRecord, fields || [], collection.name, db);

    return NextResponse.json({
      success: true,
      data: fullPopulated,
    } as ApiResponse<any>, { status: 201 });

  } catch (error: any) {
    console.error('Data POST Error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string; id: string }> }
) {
  try {
    await requireAuth();
    const { collectionId, id } = await params;

    if (!oid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid record ID' }, { status: 400 });
    }

    let collection: CollectionWithFields | null = (await getCollection(collectionId)).data;
    
    if (!collection) {
      const { data: byName } = await getCollectionByName(collectionId);
      collection = byName ? { ...byName, fields: byName.fields || [] } : null;
    }

    if (!collection) {
      return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 });
    }

    const body = await request.json();
    const _db = await getDb();

    if (body.slug && typeof body.slug === 'string') {
      body.slug = slugify(body.slug);
    }

    if (body.slug && typeof body.slug === 'string') {
      const baseSlug = body.slug;
      let uniqueSlug = baseSlug;
      let counter = 1;
      
      while (true) {
        const existing = await _db.collection(collection.name).findOne({
          slug: uniqueSlug,
          _id: { $ne: oid(id)! }
        });
        if (!existing) break;
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      body.slug = uniqueSlug;
    }

    const result = await _db.collection(collection.name).findOneAndUpdate(
      { _id: oid(id)! },
      { $set: { ...body, updated_at: new Date().toISOString() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }

    const normalizedRecord = normalizeDocId(result);

    const { data: fields } = await getCollectionFields(collection.id);
    const fullPopulated = await populateRecord(normalizedRecord, fields || [], collection.name, _db);

    return NextResponse.json({
      success: true,
      data: fullPopulated,
    } as ApiResponse<any>, { status: 200 });

  } catch (error: any) {
    console.error('Data PATCH Error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string; id: string }> }
) {
  try {
    await requireAuth();
    const { collectionId, id } = await params;

    if (!oid(id)) {
      return NextResponse.json({ success: false, error: 'Invalid record ID' }, { status: 400 });
    }

    let collection: CollectionWithFields | null = (await getCollection(collectionId)).data;
    
    if (!collection) {
      const { data: byName } = await getCollectionByName(collectionId);
      collection = byName ? { ...byName, fields: byName.fields || [] } : null;
    }

    if (!collection) {
      return NextResponse.json({ success: false, error: 'Collection not found' }, { status: 404 });
    }

    const _db = await getDb();
    const result = await _db.collection(collection.name).deleteOne({ _id: oid(id)! });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Record deleted successfully',
    } as ApiResponse<null>, { status: 200 });

  } catch (error: any) {
    console.error('Data DELETE Error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}
