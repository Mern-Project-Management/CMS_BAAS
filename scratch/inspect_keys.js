const { MongoClient } = require('mongodb');

async function main() {
  const uri = "mongodb+srv://harshitdhodirndtechnosoft:tl4aTMMScjLk4gWh@rnd.jasipfl.mongodb.net/ostech";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('ostech');
    const doc = await db.collection('hero_section').findOne({});
    console.log("KEYS IN DOCUMENT:", Object.keys(doc || {}));
    console.log("FULL DOCUMENT:", JSON.stringify(doc, null, 2));
  } finally {
    await client.close();
  }
}

main().catch(console.error);
