const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || "mongodb+srv://harshit:Harshit%40123@userinfo.lmbsytd.mongodb.net/CMS";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("CMS");
    const collection = db.collection("categories");
    
    const categories = [
      { category: "Industrial Cables", slug: "industrial-cables", description: "Heavy-duty cables designed for robust industrial environments and machinery.", createdAt: new Date(), updatedAt: new Date(), parent_id: null },
      { category: "Power Cables", slug: "power-cables", description: "Low, medium, and high voltage power transmission cables for infrastructure.", createdAt: new Date(), updatedAt: new Date(), parent_id: null },
      { category: "Control Cables", slug: "control-cables", description: "Flexible control, instrumentation, and measurement cables for automated processes.", createdAt: new Date(), updatedAt: new Date(), parent_id: null },
      { category: "Telecommunication Cables", slug: "telecom-cables", description: "Fiber optic and copper communication cables for data transmission.", createdAt: new Date(), updatedAt: new Date(), parent_id: null },
      { category: "Specialty Wires", slug: "specialty-wires", description: "Custom engineered high-temperature and resistant wires for specific environments.", createdAt: new Date(), updatedAt: new Date(), parent_id: null }
    ];

    const result = await collection.insertMany(categories);
    console.log(`${result.insertedCount} documents were inserted with the _id: ${Object.values(result.insertedIds)}`);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
