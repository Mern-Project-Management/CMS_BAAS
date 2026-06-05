import { ObjectId } from 'mongodb';
import { mongoClientPromise } from '@/lib/mongodb';
import type { Collection, CollectionWithFields, Field, User, UserRole } from '@/lib/types';
import crypto from 'crypto';

const dbName = process.env.MONGODB_DB || 'jayshree_blogs';

function nowIso() {
  return new Date().toISOString();
}

export function oid(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export function normalizeDocId<T extends { _id: ObjectId }>(doc: T) {
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

export async function getDb() {
  const client = await mongoClientPromise;
  return client.db(dbName);
}

// Resolve relation_to_collection value to an actual collection name
export async function resolveRelationCollectionName(relation: string | null | undefined) {
  if (!relation) return null;
  const db = await getDb();

  // If a collection with this name exists, use it directly
  try {
    const exists = await db.listCollections({ name: relation }).toArray();
    if (exists.length > 0) return relation;
  } catch (e) {
    // ignore and continue
  }

  // Otherwise, if the relation looks like an ObjectId, try to resolve to a collection name
  try {
    const colDoc = await db.collection('collections').findOne({ _id: oid(String(relation)) });
    if (colDoc && (colDoc as any).name) return (colDoc as any).name;
  } catch (e) {
    // ignore
  }

  return null;
}

// Get all collections with optional fieldCount
export async function getCollections() {
  try {
    const db = await getDb();
    const collectionsCol = db.collection<Omit<Collection, 'id'> & { _id: ObjectId }>('collections');
    const fieldsCol = db.collection<Omit<Field, 'id'> & { _id: ObjectId }>('fields');

    const collections = await collectionsCol.find({}).sort({ created_at: -1 }).toArray();

    const counts = await fieldsCol
      .aggregate<{ _id: string; count: number }>([{ $group: { _id: '$collection_id', count: { $sum: 1 } } }])
      .toArray();
    const countMap = new Map(counts.map((c) => [c._id, c.count]));

    const data: Collection[] = collections.map((c) => {
      const normalized = normalizeDocId(c) as unknown as Collection;
      return { ...normalized, fieldCount: countMap.get(normalized.id) ?? 0 };
    });

    return { data, error: null as null };
  } catch (error) {
    console.error('Error fetching collections:', error);
    return { data: null, error };
  }
}

// Get single collection by its name
export async function getCollectionByName(name: string) {
  try {
    const db = await getDb();
    const collectionsCol = db.collection<Omit<Collection, 'id'> & { _id: ObjectId }>('collections');
    const doc = await collectionsCol.findOne({ name });
    if (!doc) return { data: null, error: null as null };
    return { data: normalizeDocId(doc) as unknown as Collection, error: null as null };
  } catch (error) {
    console.error('Error fetching collection by name:', error);
    return { data: null, error };
  }
}

// Get single collection with fields
export async function getCollection(id: string) {
  try {
    const _id = oid(id);
    if (!_id) return { data: null, error: null };

    const db = await getDb();
    const collectionsCol = db.collection<Omit<Collection, 'id'> & { _id: ObjectId }>('collections');
    const fieldsCol = db.collection<Omit<Field, 'id'> & { _id: ObjectId }>('fields');

    const doc = await collectionsCol.findOne({ _id });
    if (!doc) return { data: null, error: null as null };

    const fields = await fieldsCol.find({ collection_id: id }).sort({ field_order: 1 }).toArray();

    const data: CollectionWithFields = {
      ...(normalizeDocId(doc) as unknown as Collection),
      fields: fields.map((f) => normalizeDocId(f) as unknown as Field),
    };

    return { data, error: null as null };
  } catch (error) {
    console.error('Error fetching collection:', error);
    return { data: null, error };
  }
}

// Create collection
export async function createCollection(collection: {
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color?: string;
}) {
  try {
    const db = await getDb();
    const collectionsCol = db.collection<any>('collections');

    const timestamp = nowIso();
    const insertDoc = { ...collection, created_at: timestamp, updated_at: timestamp };

    const existing = await collectionsCol.findOne({ name: insertDoc.name });
    if (existing) {
      return { data: null, error: new Error('Collection name already exists') };
    }

    const result = await collectionsCol.insertOne(insertDoc);
    const data: Collection = { id: result.insertedId.toString(), ...insertDoc };
    return { data, error: null as null };
  } catch (error) {
    console.error('Error creating collection:', error);
    return { data: null, error };
  }
}

// Update collection
export async function updateCollection(
  id: string,
  updates: Partial<{
    name: string;
    display_name: string;
    description: string;
    icon: string;
    color: string;
  }>
) {
  try {
    const _id = oid(id);
    if (!_id) return { data: null, error: new Error('Invalid collection id') };

    const db = await getDb();
    const collectionsCol = db.collection<any>('collections');

    if (updates.name !== undefined && updates.name !== null) {
      const existing = await collectionsCol.findOne({ name: updates.name, _id: { $ne: _id } });
      if (existing) {
        return { data: null, error: new Error('Collection name already exists') };
      }
    }

    // Build $set with only defined fields so MongoDB persists them correctly
    const setObj: Record<string, unknown> = { updated_at: nowIso() };
    if (updates.name !== undefined) setObj.name = updates.name;
    if (updates.display_name !== undefined) setObj.display_name = updates.display_name;
    if (updates.description !== undefined) setObj.description = updates.description;
    if (updates.icon !== undefined) setObj.icon = updates.icon;
    if (updates.color !== undefined) setObj.color = updates.color;

    const result = await collectionsCol.findOneAndUpdate(
      { _id },
      { $set: setObj },
      { returnDocument: 'after' }
    );

    if (!result) return { data: null, error: null as null };
    const data = normalizeDocId(result as any) as unknown as Collection;
    return { data, error: null as null };
  } catch (error) {
    console.error('Error updating collection:', error);
    return { data: null, error };
  }
}

// Delete collection (and its fields)
export async function deleteCollection(id: string) {
  try {
    const _id = oid(id);
    if (!_id) return { error: new Error('Invalid collection id') };

    const db = await getDb();
    const collectionsCol = db.collection('collections');
    const fieldsCol = db.collection('fields');

    await Promise.all([collectionsCol.deleteOne({ _id }), fieldsCol.deleteMany({ collection_id: id })]);
    return { error: null as null };
  } catch (error) {
    console.error('Error deleting collection:', error);
    return { error };
  }
}

// Get fields for a collection
export async function getCollectionFields(collectionId: string) {
  try {
    const db = await getDb();
    const fieldsCol = db.collection<Omit<Field, 'id'> & { _id: ObjectId }>('fields');

    const docs = await fieldsCol.find({ collection_id: collectionId }).sort({ field_order: 1 }).toArray();
    const data: Field[] = docs.map((d) => normalizeDocId(d) as unknown as Field);
    return { data, error: null as null };
  } catch (error) {
    console.error('Error fetching fields:', error);
    return { data: null, error };
  }
}

// Create field
export async function createField(field: {
  collection_id: string;
  name: string;
  display_name: string;
  field_type: string;
  description?: string;
  is_required?: boolean;
  is_unique?: boolean;
  is_encrypted?: boolean;
  validation_rules?: object;
  default_value?: string;
  field_order?: number;
  relation_to_collection?: string;
}) {
  try {
    const db = await getDb();
    const fieldsCol = db.collection<any>('fields');

    const timestamp = nowIso();
    const existing = await fieldsCol.findOne({ collection_id: field.collection_id, name: field.name });
    if (existing) {
      return { data: null, error: new Error('Field name already exists in this collection') };
    }

    const insertDoc = {
      ...field,
      is_required: field.is_required ?? false,
      is_unique: field.is_unique ?? false,
      is_encrypted: field.is_encrypted ?? false,
      validation_rules: field.validation_rules ?? [],
      field_order: field.field_order ?? 0,
      created_at: timestamp,
      updated_at: timestamp,
    };

    const result = await fieldsCol.insertOne(insertDoc);
    const data: Field = { id: result.insertedId.toString(), ...(insertDoc as any) };
    return { data, error: null as null };
  } catch (error) {
    console.error('Error creating field:', error);
    return { data: null, error };
  }
}

// Update field
export async function updateField(
  id: string,
  updates: Partial<{
    name: string;
    display_name: string;
    field_type: string;
    description: string;
    is_required: boolean;
    is_unique: boolean;
    is_encrypted: boolean;
    validation_rules: object;
    default_value: string;
    field_order: number;
    relation_to_collection: string;
  }>
) {
  try {
    const _id = oid(id);
    if (!_id) return { data: null, error: new Error('Invalid field id') };

    const db = await getDb();
    const fieldsCol = db.collection<any>('fields');

    if (updates.name) {
      const current = await fieldsCol.findOne({ _id });
      if (!current) return { data: null, error: null as null };
      const existing = await fieldsCol.findOne({
        collection_id: current.collection_id,
        name: updates.name,
        _id: { $ne: _id },
      });
      if (existing) {
        return { data: null, error: new Error('Field name already exists in this collection') };
      }
    }

    const result = await fieldsCol.findOneAndUpdate(
      { _id },
      { $set: { ...updates, updated_at: nowIso() } },
      { returnDocument: 'after' }
    );

    if (!result) return { data: null, error: null as null };
    const data = normalizeDocId(result as any) as unknown as Field;
    return { data, error: null as null };
  } catch (error) {
    console.error('Error updating field:', error);
    return { data: null, error };
  }
}

// Delete field
export async function deleteField(id: string) {
  try {
    const _id = oid(id);
    if (!_id) return { error: new Error('Invalid field id') };

    const db = await getDb();
    const fieldsCol = db.collection('fields');

    await fieldsCol.deleteOne({ _id });
    return { error: null as null };
  } catch (error) {
    console.error('Error deleting field:', error);
    return { error };
  }
}

// Reorder fields
export async function reorderFields(fields: Array<{ id: string; field_order: number }>) {
  try {
    const db = await getDb();
    const fieldsCol = db.collection('fields');

    // Try to find one doc to detect _id type stored in DB
    const sample = await fieldsCol.findOne({});
    const idIsObjectId = sample && sample._id instanceof ObjectId;

    console.log('[reorderFields] _id type in DB:', idIsObjectId ? 'ObjectId' : 'string/other');

    const ops = fields
      .map((f) => {
        // Build filter that works for both ObjectId and string _id
        const objectId = oid(f.id);
        const filter = idIsObjectId && objectId
          ? { _id: objectId }
          : { _id: f.id as any };

        return {
          updateOne: {
            filter,
            update: { $set: { field_order: f.field_order, updated_at: nowIso() } },
          },
        };
      });

    console.log('[reorderFields] running bulkWrite with', ops.length, 'ops');

    if (ops.length > 0) {
      const result = await fieldsCol.bulkWrite(ops, { ordered: false });
      console.log('[reorderFields] bulkWrite result:', {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      });
    }

    return { error: null as null };
  } catch (error) {
    console.error('Error reordering fields:', error);
    return { error };
  }
}

// ----- Records (dynamic data) -----

function resolveRelationLabel(record: any) {
  return (
    record.category_name ||
    record.display_name ||
    record.name ||
    record.title ||
    record.category_slug ||
    record.slug ||
    record.id ||
    String(record._id || '')
  );
}

export async function populateRelationLabels(records: any[], fields: Field[]) {
  try {
    if (!records || !Array.isArray(records) || records.length === 0) {
      return records;
    }

    const relationFields = fields.filter(
      (field): field is Field & { relation_to_collection: string } =>
        field.field_type === 'Relation' && typeof field.relation_to_collection === 'string' && field.relation_to_collection !== ''
    );

    if (relationFields.length === 0) {
      return records;
    }

    const db = await getDb();

    for (const field of relationFields) {
      const relatedIds = Array.from(
        new Set(
          records
            .map((record) => record[field.name])
            .filter((value) => value !== undefined && value !== null)
            .map(String)
        )
      );

      const validOids = relatedIds
        .map((id) => oid(id))
        .filter((value): value is ObjectId => value !== null);

      if (validOids.length === 0) {
        continue;
      }

      const relatedDocs = await db
        .collection(field.relation_to_collection)
        .find({ _id: { $in: validOids } })
        .toArray();

      const relatedMap = relatedDocs.reduce<Record<string, any>>((map, doc) => {
        const normalized = normalizeDocId(doc as any);
        map[normalized.id] = normalized;
        return map;
      }, {});

      for (const record of records) {
        const rawValue = record[field.name];
        const lookupId = rawValue ? String(rawValue) : null;
        const related = lookupId ? relatedMap[lookupId] : null;

        record[`${field.name}_populated`] = related ?? null;
        // Only set a label if we actually found the related doc — never expose raw IDs
        record[`${field.name}_label`] = related ? resolveRelationLabel(related) : null;
      }
    }

    return records;
  } catch (error) {
    console.error('Error populating relation labels:', error);
    return records;
  }
}

export async function getRecords(collectionName: string, limit = 100, filter: Record<string, any> = {}) {
  try {
    const db = await getDb();
    const docs = await db.collection(collectionName)
      .find(filter)
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
    const data = docs.map((d) => normalizeDocId(d as any));
    return { data, error: null as null };
  } catch (error) {
    console.error(`Error fetching records from ${collectionName}:`, error);
    return { data: null, error };
  }
}

export async function createRecord(collectionName: string, data: Record<string, unknown>) {
  try {
    const db = await getDb();
    const timestamp = nowIso();
    const insertDoc = {
      ...data,
      created_at: timestamp,
      updated_at: timestamp,
    };
    const result = await db.collection(collectionName).insertOne(insertDoc);
    return {
      data: { id: result.insertedId.toString(), ...insertDoc },
      error: null as null,
    };
  } catch (error) {
    console.error(`Error creating record in ${collectionName}:`, error);
    return { data: null, error };
  }
}

export async function updateRecord(
  collectionName: string,
  recordId: string,
  data: Record<string, unknown>
) {
  try {
    const _id = oid(recordId);
    if (!_id) return { data: null, error: new Error('Invalid record id') };
    const db = await getDb();
    const result = await db.collection(collectionName).findOneAndUpdate(
      { _id },
      { $set: { ...data, updated_at: nowIso() } },
      { returnDocument: 'after' }
    );
    if (!result) return { data: null, error: null as null };
    return { data: normalizeDocId(result as any), error: null as null };
  } catch (error) {
    console.error(`Error updating record in ${collectionName}:`, error);
    return { data: null, error };
  }
}

export async function deleteRecord(collectionName: string, recordId: string) {
  try {
    const _id = oid(recordId);
    if (!_id) return { error: new Error('Invalid record id') };
    const db = await getDb();
    await db.collection(collectionName).deleteOne({ _id });
    return { error: null as null };
  } catch (error) {
    console.error(`Error deleting record in ${collectionName}:`, error);
    return { error };
  }
}

// ----- User & Auth -----

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function getUserByUsername(username: string) {
  try {
    const db = await getDb();
    const usersCol = db.collection<Omit<User, 'id'> & { _id: ObjectId; password: string }>('users');
    const doc = await usersCol.findOne({ username });
    if (!doc) return { data: null, error: null as null };
    const { password, ...user } = doc;
    return { data: normalizeDocId(user) as unknown as User, error: null as null };
  } catch (error) {
    console.error('Error fetching user:', error);
    return { data: null, error };
  }
}

export async function verifyUser(username: string, password: string) {
  try {
    const db = await getDb();
    const usersCol = db.collection<Omit<User, 'id'> & { _id: ObjectId; password: string }>('users');
    const doc = await usersCol.findOne({ username });
    if (!doc) return { data: null, error: new Error('Invalid credentials') };
    if (doc.password !== hashPassword(password)) {
      return { data: null, error: new Error('Invalid credentials') };
    }
    const { password: _, ...user } = doc;
    return { data: normalizeDocId(user) as unknown as User, error: null as null };
  } catch (error) {
    console.error('Error verifying user:', error);
    return { data: null, error };
  }
}

export async function createUser(user: {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  try {
    const db = await getDb();
    const usersCol = db.collection('users');
    const existing = await usersCol.findOne({ $or: [{ username: user.username }, { email: user.email }] });
    if (existing) {
      return { data: null, error: new Error('User already exists') };
    }
    const timestamp = nowIso();
    const insertDoc = {
      ...user,
      password: hashPassword(user.password),
      created_at: timestamp,
      updated_at: timestamp,
    };
    const result = await usersCol.insertOne(insertDoc);
    const { password: _, ...userData } = insertDoc;
    return { data: { id: result.insertedId.toString(), ...userData } as unknown as User, error: null as null };
  } catch (error) {
    console.error('Error creating user:', error);
    return { data: null, error };
  }
}

export async function getUserById(id: string) {
  try {
    const _id = oid(id);
    if (!_id) return { data: null, error: new Error('Invalid user id') };
    const db = await getDb();
    const usersCol = db.collection<Omit<User, 'id'> & { _id: ObjectId; password: string }>('users');
    const doc = await usersCol.findOne({ _id });
    if (!doc) return { data: null, error: null as null };
    const { password, ...user } = doc;
    return { data: normalizeDocId(user) as unknown as User, error: null as null };
  } catch (error) {
    console.error('Error fetching user:', error);
    return { data: null, error };
  }
}
