/**
 * Seed a default superadmin user.
 *
 * Usage:
 *   MONGODB_URI="..." MONGODB_DB="jayshree_blogs" npm run seed:superadmin
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');
const crypto = require('crypto');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'jayshree_blogs';

if (!uri) {
  console.error('Missing MONGODB_URI. Set it in your environment before running the seed.');
  process.exit(1);
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const usersCol = db.collection('users');

  const defaultUser = {
    username: 'superadmin',
    email: 'admin@example.com',
    password: hashPassword('admin123'),
    role: 'superadmin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const existing = await usersCol.findOne({ username: defaultUser.username });
  if (existing) {
    console.log(`ℹ️ Superadmin user already exists (${existing._id.toString()})`);
    console.log('   Username: superadmin');
    console.log('   Password: admin123');
  } else {
    const result = await usersCol.insertOne(defaultUser);
    console.log(`✅ Created superadmin user (${result.insertedId.toString()})`);
    console.log('   Username: superadmin');
    console.log('   Password: admin123');
    console.log('   ⚠️  Please change the password after first login!');
  }

  await client.close();
  console.log('🎉 Seed complete.');
}

run().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
