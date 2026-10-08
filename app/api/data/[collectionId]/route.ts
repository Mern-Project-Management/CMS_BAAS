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
import { validateRecord } from '@/lib/validation-engine';

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
      if (key !== 'limit' && key !== 'offset' && key !== 'fields' && key !== '_t') {
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
    const session = await requireAuth();
    if (session.role === 'viewer') {
      return NextResponse.json({ success: false, error: 'Forbidden: Viewers cannot add data' }, { status: 403 });
    }
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
    const { data: fields } = await getCollectionFields(collection.id);

    const validateAndPrepare = async (itemData: any) => {
      // Trim strings
      for (const key in itemData) {
        if (typeof itemData[key] === 'string') {
          itemData[key] = itemData[key].trim();
        }
      }

      // Run validation rules
      if (fields) {
        const validation = validateRecord(itemData, fields);
        if (!validation.valid) {
          throw new Error(validation.errors[0].message);
        }

        // Uniqueness check
        for (const field of fields) {
          if (field.is_unique && itemData[field.name] !== undefined && itemData[field.name] !== null && itemData[field.name] !== '') {
            const duplicate = await db.collection(collection.name).findOne({ [field.name]: itemData[field.name] });
            if (duplicate) {
              throw new Error(`${field.display_name} already exists.`);
            }
          }
        }
      }
    };

    if (Array.isArray(body)) {
      const docs = [];
      for (const item of body) {
        let itemData = { ...item };
        await validateAndPrepare(itemData);

        if (itemData.slug && typeof itemData.slug === 'string') {
          itemData.slug = slugify(itemData.slug);
        }

        if (itemData.slug && typeof itemData.slug === 'string') {
          const baseSlug = itemData.slug;
          let uniqueSlug = baseSlug;
          let counter = 1;
          
          while (await db.collection(collection.name).findOne({ slug: uniqueSlug })) {
            uniqueSlug = `${baseSlug}-${counter}`;
            counter++;
          }
          itemData.slug = uniqueSlug;
        }

        const now = new Date().toISOString();
        docs.push({
          ...itemData,
          created_at: now,
          updated_at: now,
        });
      }

      if (docs.length === 0) {
        return NextResponse.json({ success: true, data: [] }, { status: 201 });
      }

      const result = await db.collection(collection.name).insertMany(docs);
      const insertedDocs = [];
      for (let i = 0; i < docs.length; i++) {
        const normalizedRecord = normalizeDocId({ ...docs[i], _id: result.insertedIds[i] });
        const fullPopulated = await populateRecord(normalizedRecord, fields || [], collection.name, db);
        insertedDocs.push(fullPopulated);
      }

      return NextResponse.json({
        success: true,
        data: insertedDocs,
      } as ApiResponse<any>, { status: 201 });
    }

    // Single document insertion logic
    await validateAndPrepare(body);

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
    const session = await requireAuth();
    if (session.role === 'viewer') {
      return NextResponse.json({ success: false, error: 'Forbidden: Viewers cannot edit data' }, { status: 403 });
    }
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

    // Trim strings
    for (const key in body) {
      if (typeof body[key] === 'string') {
        body[key] = body[key].trim();
      }
    }

    const { data: fields } = await getCollectionFields(collection.id);
    if (fields) {
      const existingRecord = await _db.collection(collection.name).findOne({ _id: oid(id)! });
      if (!existingRecord) {
        return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
      }
      const fullRecord = { ...normalizeDocId(existingRecord), ...body };
      
      const validation = validateRecord(fullRecord, fields);
      if (!validation.valid) {
        return NextResponse.json({ success: false, error: validation.errors[0].message }, { status: 400 });
      }

      // Check uniqueness
      for (const field of fields) {
        if (field.is_unique && fullRecord[field.name] !== undefined && fullRecord[field.name] !== null && fullRecord[field.name] !== '') {
          const duplicate = await _db.collection(collection.name).findOne({
            [field.name]: fullRecord[field.name],
            _id: { $ne: oid(id)! }
          });
          if (duplicate) {
            return NextResponse.json({ success: false, error: `${field.display_name} already exists.` }, { status: 409 });
          }
        }
      }
    }

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
    const session = await requireAuth();
    if (session.role === 'viewer') {
      return NextResponse.json({ success: false, error: 'Forbidden: Viewers cannot delete data' }, { status: 403 });
    }
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
