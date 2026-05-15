/**
 * API Route: Get breadcrumb path to a record
 * Usage: GET /api/breadcrumbs/[collectionId]/[recordId]
 * 
 * Returns the full path from root to the specified record
 * Useful for navigation and showing current location in hierarchy
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCollection, getCollectionByName, getDb, oid, normalizeDocId } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import type { ApiResponse, CollectionWithFields } from '@/lib/types';

async function getAncestors(
  db: any,
  collectionName: string,
  recordId: string,
  parentFieldName: string = 'parent_id',
  ancestors: any[] = []
) {
  const collection = db.collection(collectionName);

  const _id = oid(recordId);
  if (!_id) return ancestors;

  const record = await collection.findOne({ _id });
  if (!record) return ancestors;

  const parentId = record[parentFieldName];
  if (!parentId) return ancestors;

  const parentRecord = await collection.findOne({
    _id: oid(parentId),
  });

  if (!parentRecord) return ancestors;

  const normalized = normalizeDocId(parentRecord);
  ancestors.unshift(normalized);

  return getAncestors(
    db,
    collectionName,
    parentId,
    parentFieldName,
    ancestors
  );
}

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ collectionId: string; recordId: string }>
  }
) {
  try {
    await requireAuth();
    const { collectionId, recordId } = await params;

    // Resolve collection metadata (Try ID first, then Name)
    let collection: CollectionWithFields | null = (await getCollection(collectionId)).data;
    
    if (!collection) {
      const { data: byName } = await getCollectionByName(collectionId);
      collection = byName ? { ...byName, fields: [] } : null;
    }

    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    const db = await getDb();
    const collectionObj = db.collection(collection.name);

    // Get the record
    const _id = oid(recordId);
    if (!_id) {
      return NextResponse.json(
        { success: false, error: 'Invalid record ID' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const record = await collectionObj.findOne({ _id });
    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Record not found' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    const parentFieldName =
      request.nextUrl.searchParams.get('parentField') || 'parent_id';

    // Get ancestors
    const ancestors = await getAncestors(
      db,
      collection.name,
      recordId,
      parentFieldName
    );

    // Build breadcrumb: ancestors + current
    const breadcrumb = [...ancestors, normalizeDocId(record)];

    return NextResponse.json(
      {
        success: true,
        data: breadcrumb,
      } as ApiResponse<typeof breadcrumb>,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Breadcrumb API Error:', error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
