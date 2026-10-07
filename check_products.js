const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || "mongodb+srv://harshit:Harshit%40123@userinfo.lmbsytd.mongodb.net/CMS";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("CMS");
    
    console.log("--- our_products (limit 2) ---");
    const products = await db.collection("our_products").find({}).limit(2).toArray();
    console.log(JSON.stringify(products, null, 2));
    
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
