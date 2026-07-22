const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://harshitdhodirndtechnosoft:tl4aTMMScjLk4gWh@rnd.jasipfl.mongodb.net/ostech";
const dbName = "ostech";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection('page_components');
    const docs = await col.find({ page: 'products' }).toArray();
    console.log("page_components for products in DB:", docs);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
