import { ObjectId } from 'mongodb';
import { mongoClientPromise } from '@/lib/mongodb';
import type { Collection, CollectionWithFields, Field, User, UserRole } from '@/lib/types';
import crypto from 'crypto';

const dbName = process.env.MONGODB_DB || 'CMS';

function nowIso() {
  return new Date().toISOString();
}

function oid(id: string) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function normalizeDocId<T extends { _id: ObjectId }>(doc: T) {
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

async function getDb() {
  const client = await mongoClientPromise;
  return client.db(dbName);
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

// Get single collection with fields
export async function getCollection(id: string) {
  try {
    const _id = oid(id);
    if (!_id) return { data: null, error: new Error('Invalid collection id') };

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

    const ops = fields
      .map((f) => {
        const _id = oid(f.id);
        if (!_id) return null;
        return {
          updateOne: {
            filter: { _id },
            update: { $set: { field_order: f.field_order, updated_at: nowIso() } },
          },
        };
      })
      .filter(Boolean) as any[];

    if (ops.length > 0) {
      await fieldsCol.bulkWrite(ops, { ordered: false });
    }

    return { error: null as null };
  } catch (error) {
    console.error('Error reordering fields:', error);
    return { error };
  }
}

// ----- Records (dynamic data) -----

type RecordDoc = {
  _id: ObjectId;
  collection_id: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export async function getRecords(collectionId: string, limit = 100) {
  try {
    const db = await getDb();
    const recordsCol = db.collection<RecordDoc>('records');
    const docs = await recordsCol
      .find({ collection_id: collectionId })
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
    const data = docs.map((d) => normalizeDocId(d) as unknown as Record<string, unknown>);
    return { data, error: null as null };
  } catch (error) {
    console.error('Error fetching records:', error);
    return { data: null, error };
  }
}

export async function createRecord(collectionId: string, data: Record<string, unknown>) {
  try {
    const db = await getDb();
    const recordsCol = db.collection('records');
    const timestamp = nowIso();
    const insertDoc = {
      collection_id: collectionId,
      data,
      created_at: timestamp,
      updated_at: timestamp,
    };
    const result = await recordsCol.insertOne(insertDoc);
    return {
      data: { id: result.insertedId.toString(), ...insertDoc },
      error: null as null,
    };
  } catch (error) {
    console.error('Error creating record:', error);
    return { data: null, error };
  }
}

export async function updateRecord(
  collectionId: string,
  recordId: string,
  data: Record<string, unknown>
) {
  try {
    const _id = oid(recordId);
    if (!_id) return { data: null, error: new Error('Invalid record id') };

    const db = await getDb();
    const recordsCol = db.collection('records');

    const result = await recordsCol.findOneAndUpdate(
      { _id, collection_id: collectionId },
      { $set: { data, updated_at: nowIso() } },
      { returnDocument: 'after' }
    );

    if (!result) return { data: null, error: null as null };
    return { data: normalizeDocId(result as any), error: null as null };
  } catch (error) {
    console.error('Error updating record:', error);
    return { data: null, error };
  }
}

export async function deleteRecord(collectionId: string, recordId: string) {
  try {
    const _id = oid(recordId);
    if (!_id) return { error: new Error('Invalid record id') };

    const db = await getDb();
    const recordsCol = db.collection('records');
    await recordsCol.deleteOne({ _id, collection_id: collectionId });
    return { error: null as null };
  } catch (error) {
    console.error('Error deleting record:', error);
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

