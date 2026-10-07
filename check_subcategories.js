const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || "mongodb+srv://harshit:Harshit%40123@userinfo.lmbsytd.mongodb.net/CMS";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("CMS");
    const collection = db.collection("categories");
    
    const docs = await collection.find({ parent_category: { $ne: "" } }).toArray();
    console.log(docs.map(d => ({ name: d.category_name, slug: d.category_slug })));
    
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
