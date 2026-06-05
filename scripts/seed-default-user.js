/**
 * Seed a default "users" collection and basic fields if they do not already exist.
 *
 * Usage:
 *   MONGODB_URI="..." MONGODB_DB="jayshree_blogs" npm run seed:default-user
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'jayshree_blogs';

if (!uri) {
  console.error('Missing MONGODB_URI. Set it in your environment before running the seed.');
  process.exit(1);
}

const collectionName = 'users';

const fields = [
  {
    name: 'email',
    display_name: 'Email',
    field_type: 'Text',
    description: 'User email address',
    is_required: true,
    is_unique: true,
    field_order: 0,
  },
  {
    name: 'full_name',
    display_name: 'Full Name',
    field_type: 'Text',
    description: 'Full name of the user',
    is_required: true,
    field_order: 1,
  },
  {
    name: 'is_active',
    display_name: 'Active',
    field_type: 'Boolean',
    description: 'Is the user active?',
    is_required: false,
    field_order: 2,
  },
  {
    name: 'created_at',
    display_name: 'Created At',
    field_type: 'DateTime',
    description: 'User creation timestamp',
    is_required: false,
    field_order: 3,
  },
];

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const collectionsCol = db.collection('collections');
  const fieldsCol = db.collection('fields');

  const timestamp = new Date().toISOString();

  let collectionDoc = await collectionsCol.findOne({ name: collectionName });
  if (!collectionDoc) {
    const insertDoc = {
      name: collectionName,
      display_name: 'Users',
      description: 'Default user schema',
      created_at: timestamp,
      updated_at: timestamp,
    };
    const result = await collectionsCol.insertOne(insertDoc);
    collectionDoc = { _id: result.insertedId, ...insertDoc };
    console.log(`✅ Created collection "${collectionName}" (${collectionDoc._id.toString()})`);
  } else {
    console.log(`ℹ️ Collection "${collectionName}" already exists (${collectionDoc._id.toString()})`);
  }

  const collectionId = collectionDoc._id.toString();

  for (const f of fields) {
    const existing = await fieldsCol.findOne({ collection_id: collectionId, name: f.name });
    if (existing) {
      console.log(`ℹ️ Field "${f.name}" already exists`);
      continue;
    }

    const insertDoc = {
      ...f,
      collection_id: collectionId,
      is_encrypted: false,
      validation_rules: [],
      default_value: f.default_value ?? null,
      relation_to_collection: f.relation_to_collection ?? null,
      created_at: timestamp,
      updated_at: timestamp,
    };

    const result = await fieldsCol.insertOne(insertDoc);
    console.log(`✅ Created field "${f.name}" (${result.insertedId.toString()})`);
  }

  await client.close();
  console.log('🎉 Seed complete.');
}

run().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
