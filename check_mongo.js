const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || "mongodb+srv://harshit:Harshit%40123@userinfo.lmbsytd.mongodb.net/CMS";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("CMS");
    
    console.log("--- Categories (limit 10) ---");
    const categories = await db.collection("categories").find({}).limit(10).toArray();
    console.log(JSON.stringify(categories, null, 2));

    console.log("--- Records (limit 2) ---");
    const records = await db.collection("records").find({}).limit(2).toArray();
    console.log(JSON.stringify(records, null, 2));
    
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
