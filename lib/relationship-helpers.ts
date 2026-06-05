/**
 * Relationship helpers for hierarchical data
 * Add these functions to your lib/db.ts file
 */

import { ObjectId } from 'mongodb';
import { getDb, oid, normalizeDocId, resolveRelationCollectionName } from './db';

/**
 * Get a single record with populated relationships
 * @param collectionName - Name of the collection
 * @param recordId - ID of the record
 * @param fieldsConfig - Field definitions to identify relations
 */
export async function getRecordWithPopulation(
  collectionName: string,
  recordId: string,
  fieldsConfig: any[]
) {
  const db = await getDb();
  const collection = db.collection(collectionName);

  const _id = oid(recordId);
  if (!_id) return null;

  const record = await collection.findOne({ _id });
  if (!record) return null;

  // Find all relation fields
  const relationFields = fieldsConfig.filter((f) => f.field_type === 'Relation');

  // Populate each relation field
  for (const field of relationFields) {
    if (!field.relation_to_collection) continue;

    const relatedId = record[field.name];
    if (!relatedId) {
      record[`${field.name}_populated`] = null;
      continue;
    }

    try {
      const targetCollectionName = await resolveRelationCollectionName(field.relation_to_collection);
      if (!targetCollectionName) {
        record[`${field.name}_populated`] = null;
        continue;
      }

      const relatedOid = oid(relatedId);
      if (!relatedOid) {
        record[`${field.name}_populated`] = null;
        continue;
      }

      const relatedRecord = await db.collection(targetCollectionName).findOne({ _id: relatedOid });

      record[`${field.name}_populated`] = relatedRecord ? normalizeDocId(relatedRecord) : null;
    } catch (error) {
      console.error(
        `Error populating ${field.name} from ${field.relation_to_collection}:`,
        error
      );
      record[`${field.name}_populated`] = null;
    }
  }

  return normalizeDocId(record);
}

/**
 * Get all child records of a parent
 * @param collectionName - Name of the collection
 * @param parentId - ID of the parent record
 * @param parentFieldName - Name of the field containing parent ID (default: 'parent_id')
 */
export async function getChildRecords(
  collectionName: string,
  parentId: string,
  parentFieldName = 'parent_id'
) {
  try {
    const db = await getDb();
    const collection = db.collection(collectionName);

    const children = await collection
      .find({ [parentFieldName]: parentId })
      .sort({ created_at: 1 })
      .toArray();

    return {
      data: children.map((child) => normalizeDocId(child)),
      error: null,
    };
  } catch (error) {
    console.error('Error getting child records:', error);
    return { data: null, error };
  }
}

/**
 * Get complete hierarchy tree (recursive)
 * @param collectionName - Name of the collection
 * @param parentId - Starting parent ID (null for top-level)
 * @param parentFieldName - Name of the field containing parent ID
 */
export async function getHierarchyTree(
  collectionName: string,
  parentId: string | null = null,
  parentFieldName = 'parent_id'
) {
  try {
    const db = await getDb();
    const collection = db.collection(collectionName);

    // Find records at this level
    const records = await collection
      .find({ [parentFieldName]: parentId })
      .sort({ created_at: 1 })
      .toArray();

    // Recursively build tree
    const tree: any[] = [];
    for (const record of records) {
      const normalized = normalizeDocId(record);

      // Get children recursively
      const children: any[] = await getHierarchyTree(
        collectionName,
        normalized.id,
        parentFieldName
      );

      tree.push({
        ...normalized,
        children: children.length > 0 ? children : [],
      });
    }

    return tree;
  } catch (error) {
    console.error('Error building hierarchy tree:', error);
    return [];
  }
}

/**
 * Get all ancestors (parents, grandparents, etc.)
 * Returns list from immediate parent to root
 */
export async function getAncestors(
  collectionName: string,
  recordId: string,
  parentFieldName = 'parent_id',
  ancestors: any[] = []
): Promise<any[]> {
  try {
    const db = await getDb();
    const collection = db.collection(collectionName);

    const _id = oid(recordId);
    if (!_id) return ancestors;

    const record = await collection.findOne({ _id });
    if (!record) return ancestors;

    const parentId = record[parentFieldName];
    if (!parentId) return ancestors;

    const parentOid = oid(parentId);
    if (!parentOid) return ancestors;

    // Get parent record
    const parentRecord = await collection.findOne({ _id: parentOid });

    if (!parentRecord) return ancestors;

    const normalized = normalizeDocId(parentRecord);
    ancestors.unshift(normalized);

    // Recursively get parent's ancestors
    return getAncestors(
      collectionName,
      parentId,
      parentFieldName,
      ancestors
    );
  } catch (error) {
    console.error('Error getting ancestors:', error);
    return ancestors;
  }
}

/**
 * Get breadcrumb path from root to current record
 * Useful for navigation
 */
export async function getBreadcrumbPath(
  collectionName: string,
  recordId: string,
  parentFieldName = 'parent_id'
) {
  try {
    const db = await getDb();
    const collection = db.collection(collectionName);

    const _id = oid(recordId);
    if (!_id) return [];

    const record = await collection.findOne({ _id });
    if (!record) return [];

    const normalized = normalizeDocId(record);
    const ancestors = await getAncestors(
      collectionName,
      recordId,
      parentFieldName
    );

    // Breadcrumb: ancestors + current
    return [...ancestors, normalized];
  } catch (error) {
    console.error('Error getting breadcrumb path:', error);
    return [];
  }
}

/**
 * Get all descendants (children, grandchildren, etc.)
 * Returns flat list of all descendants
 */
export async function getAllDescendants(
  collectionName: string,
  parentId: string,
  parentFieldName = 'parent_id',
  descendants: any[] = []
): Promise<any[]> {
  try {
    const db = await getDb();
    const collection = db.collection(collectionName);

    // Get direct children
    const children = await collection
      .find({ [parentFieldName]: parentId })
      .toArray();

    for (const child of children) {
      const normalized = normalizeDocId(child);
      descendants.push(normalized);

      // Recursively get descendants
      await getAllDescendants(
        collectionName,
        normalized.id,
        parentFieldName,
        descendants
      );
    }

    return descendants;
  } catch (error) {
    console.error('Error getting descendants:', error);
    return descendants;
  }
}

/**
 * Check if a record is a descendant of another
 * Useful for preventing circular references
 */
export async function isDescendantOf(
  collectionName: string,
  recordId: string,
  potentialParentId: string,
  parentFieldName = 'parent_id'
): Promise<boolean> {
  try {
    const db = await getDb();
    const collection = db.collection(collectionName);

    const _id = oid(recordId);
    if (!_id) return false;

    const record = await collection.findOne({ _id });
    if (!record) return false;

    // Check if the record's parent is the potentialParentId
    if (record[parentFieldName] === potentialParentId) {
      return true;
    }

    // Recursively check parent's ancestors
    if (record[parentFieldName]) {
      return isDescendantOf(
        collectionName,
        record[parentFieldName],
        potentialParentId,
        parentFieldName
      );
    }

    return false;
  } catch (error) {
    console.error('Error checking descendant relationship:', error);
    return false;
  }
}

/**
 * Move a record to a new parent
 * Validates to prevent circular references
 */
export async function moveRecord(
  collectionName: string,
  recordId: string,
  newParentId: string | null,
  parentFieldName = 'parent_id'
) {
  try {
    const db = await getDb();
    const collection = db.collection(collectionName);

    // Prevent circular references
    if (newParentId) {
      const isCircular = await isDescendantOf(
        collectionName,
        newParentId,
        recordId,
        parentFieldName
      );

      if (isCircular) {
        return {
          success: false,
          error: 'Cannot move record: would create circular reference',
        };
      }
    }

    const _id = oid(recordId);
    if (!_id) {
      return { success: false, error: 'Invalid record ID' };
    }

    const result = await collection.updateOne(
      { _id },
      {
        $set: {
          [parentFieldName]: newParentId,
          updated_at: new Date().toISOString(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: 'Record not found' };
    }

    return { success: true, message: 'Record moved successfully' };
  } catch (error) {
    console.error('Error moving record:', error);
    return { success: false, error };
  }
}

/**
 * Get records related to another collection
 * Example: Get all blog posts in a category
 */
export async function getRelatedRecords(
  fromCollectionName: string,
  fromRecordId: string,
  toCollectionName: string,
  foreignKeyField: string
) {
  try {
    const db = await getDb();
    const toCollection = db.collection(toCollectionName);

    // Find all records in toCollection that reference fromRecordId
    const related = await toCollection
      .find({ [foreignKeyField]: fromRecordId })
      .sort({ created_at: -1 })
      .toArray();

    return {
      data: related.map((r) => normalizeDocId(r)),
      error: null,
    };
  } catch (error) {
    console.error('Error getting related records:', error);
    return { data: null, error };
  }
}
