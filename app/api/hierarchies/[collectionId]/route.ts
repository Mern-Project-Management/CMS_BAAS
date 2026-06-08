import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  getCollectionByName,
  getCollectionFields,
  getDb,
  normalizeDocId,
  oid,
  resolveRelationCollectionName,
} from '@/lib/db';

import type { ApiResponse, CollectionWithFields, Field } from '@/lib/types';

async function buildTree(
  db: any,
  collectionName: string,
  fields: Field[],
  parentId: string | null = null,
  parentFieldName: string = 'parent_id',
  visited: Set<string> = new Set(),
  rootQuery: any = null
): Promise<any[]> {
  const collection = db.collection(collectionName);

  // Prevent circular recursion
  if (parentId && visited.has(parentId)) {
    return [];
  }

  // Create branch-specific visited set
  const currentVisited = new Set(visited);

  if (parentId) {
    currentVisited.add(parentId);
  }

  // Define query for the current level.
  // For roots (parentId is null), we strictly check if the hierarchy field is explicitly null or does not exist.
  // Records with an empty string as parent are NOT considered roots here, as they might be intended as children of an empty string parent.
  let query: any;
  if (rootQuery) {
    query = rootQuery;
  } else if (parentId === null) {
    query = {
      $or: [
        { [parentFieldName]: null },
        { [parentFieldName]: '' }, // Treat empty strings as roots for robust fetching
        { [parentFieldName]: { $exists: false } },
      ],
    };
  } else {
    query = {
      // Try to cast to ObjectId for the query, fallback to string if invalid
      $or: [
        { [parentFieldName]: oid(parentId) },
        { [parentFieldName]: parentId },
      ],
    };
  }

  const records = await collection
    .find(query)
    .sort({ created_at: 1 })
    .toArray();

  const tree = await Promise.all(
    records.map(async (record: any) => {
      const normalized: any = normalizeDocId(record);

      // Populate relational fields for the current node
      for (const field of fields) {
        if (field.field_type === 'Relation' && field.relation_to_collection && normalized[field.name]) {
          try {
            const targetOid = oid(normalized[field.name]);
            if (!targetOid) continue;

            const targetCollectionName = await resolveRelationCollectionName(field.relation_to_collection);
            if (!targetCollectionName) continue;

            const relatedDoc = await db.collection(targetCollectionName).findOne({ _id: targetOid });
            if (relatedDoc) {
              normalized[`${field.name}_populated`] = normalizeDocId(relatedDoc);
            }
          } catch (e) {
            // Silently skip if related document lookup fails
          }
        }
      }

      const children = await buildTree(
        db,
        collectionName,
        fields,
        normalized.id,
        parentFieldName,
        currentVisited,
        null // Recursion should find children by ID, not by the initial filter
      );

      return {
        ...normalized,
        children,
      };
    })
  );

  return tree;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ collectionId: string }> }
) {
  try {
    const { collectionId } = await context.params;

    // Resolve collection metadata
    let collection: CollectionWithFields | null = (await getCollection(collectionId)).data;

    // Try by collection name if ID not found
    if (!collection) {
      const { data: byName } = await getCollectionByName(collectionId);
      collection = byName ? { ...byName, fields: [] } : null;
    }

    if (!collection) {
      return NextResponse.json(
        {
          success: false,
          error: `Collection '${collectionId}' not found`,
        } as ApiResponse<null>,
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    // Parent field from query param
    const parentFieldName = searchParams.get('parentField') || 'parent_id';

    // Extract all other query parameters as root-level filters for the hierarchy
    const rootQuery: any = {};
    let hasFilters = false;
    searchParams.forEach((value, key) => {
      if (key !== 'parentField') {
        if (key === 'id' || key === '_id') {
          rootQuery['_id'] = oid(value) || value;
        } else {
          rootQuery[key] = value;
        }
        hasFilters = true;
      }
    });

    const db = await getDb();

    // Ensure we have field metadata to identify which fields to populate
    let fields = collection.fields || [];
    if (fields.length === 0) {
      const { data: fetchedFields } = await getCollectionFields(collection.id);
      fields = fetchedFields || [];
    }

    const tree = await buildTree(
      db,
      collection.name,
      fields,
      null, // parentId
      parentFieldName,
      new Set(), // visited
      hasFilters ? rootQuery : null
    );

    return NextResponse.json(
      {
        success: true,
        data: tree,
      } as ApiResponse<typeof tree>,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Hierarchy API Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}