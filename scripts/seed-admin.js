/**
 * Seed a default admin user.
 *
 * Usage:
 *   MONGODB_URI="..." MONGODB_DB="jayshree_blogs" npm run seed:admin
 */

require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');
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
    username: 'admin',
    email: 'admin.user@example.com',
    password: hashPassword('admin123'),
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const existing = await usersCol.findOne({ username: defaultUser.username });
  if (existing) {
    console.log(`ℹ️ Admin user already exists (${existing._id.toString()})`);
    console.log('   Username: admin');
    console.log('   Password: admin123');
  } else {
    const result = await usersCol.insertOne(defaultUser);
    console.log(`✅ Created admin user (${result.insertedId.toString()})`);
    console.log('   Username: admin');
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
