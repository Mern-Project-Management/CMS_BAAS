const { MongoClient } = require('mongodb');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function addViewer() {
  const uri = "mongodb+srv://harshit:Harshit%40123@userinfo.lmbsytd.mongodb.net/CMS";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('CMS');
    const usersCol = db.collection('users');

    const viewerExists = await usersCol.findOne({ username: 'viewer' });
    if (viewerExists) {
      console.log('Viewer user already exists.');
    } else {
      await usersCol.insertOne({
        username: 'viewer',
        email: 'viewer@admin.com',
        password: hashPassword('viewer123'),
        role: 'viewer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      console.log('Viewer user successfully created.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

addViewer();
