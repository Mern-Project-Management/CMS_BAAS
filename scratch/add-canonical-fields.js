const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env
const envPath = path.resolve(process.cwd(), '.env');
let MONGODB_URI = '';
let MONGODB_DB = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const uriMatch = envContent.match(/^MONGODB_URI=(.*)$/m);
  const dbMatch = envContent.match(/^MONGODB_DB=(.*)$/m);
  if (uriMatch) MONGODB_URI = uriMatch[1].trim();
  if (dbMatch) MONGODB_DB = dbMatch[1].trim();
}

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI not found in .env');
  process.exit(1);
}

async function run() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB.');
    const db = client.db(MONGODB_DB || undefined);

    const collectionsCol = db.collection('collections');
    const fieldsCol = db.collection('fields');

    const targetCollections = ['blog', 'our_products', 'manage-meta'];

    for (const name of targetCollections) {
      console.log(`Processing collection: ${name}`);
      const col = await collectionsCol.findOne({ name });
      if (!col) {
        console.log(`Collection "${name}" not found. Skipping.`);
        continue;
      }

      const collectionId = col._id.toString();

      // Check if canonical_link field already exists
      const existingField = await fieldsCol.findOne({
        collection_id: collectionId,
        name: 'canonical_link'
      });

      if (existingField) {
        console.log(`Field "canonical_link" already exists in "${name}" collection.`);
        continue;
      }

      // Find the highest field_order to append to
      const lastField = await fieldsCol.findOne(
        { collection_id: collectionId },
        { sort: { field_order: -1 } }
      );
      const nextOrder = lastField ? (lastField.field_order || 0) + 1 : 1;

      const timestamp = new Date().toISOString();
      const newField = {
        collection_id: collectionId,
        name: 'canonical_link',
        display_name: 'Canonical Link',
        field_type: 'Text',
        description: 'The canonical URL/link for this page',
        is_required: false,
        is_unique: false,
        is_encrypted: false,
        validation_rules: {},
        field_order: nextOrder,
        created_at: timestamp,
        updated_at: timestamp
      };

      await fieldsCol.insertOne(newField);
      console.log(`Successfully added "canonical_link" to "${name}" collection at order ${nextOrder}.`);
    }

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.close();
    console.log('Database connection closed.');
  }
}

run();
