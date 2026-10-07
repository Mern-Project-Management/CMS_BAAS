const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || "mongodb+srv://harshit:Harshit%40123@userinfo.lmbsytd.mongodb.net/CMS";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("CMS");
    const collection = db.collection("categories");
    
    // Delete the previously inserted bad documents (where category is set instead of category_name)
    const deleteResult = await collection.deleteMany({ category: { $exists: true } });
    console.log(`Deleted ${deleteResult.deletedCount} incorrectly formatted documents.`);

    const categories = [
      { 
        category_name: "Industrial Cables", 
        category_slug: "industrial-cables", 
        short_description: "Heavy-duty cables designed for robust industrial environments and machinery.",
        category_details: "<p>Heavy-duty cables designed for robust industrial environments and machinery.</p>",
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString(), 
        parent_category: "" 
      },
      { 
        category_name: "Power Cables", 
        category_slug: "power-cables", 
        short_description: "Low, medium, and high voltage power transmission cables for infrastructure.", 
        category_details: "<p>Low, medium, and high voltage power transmission cables for infrastructure.</p>",
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString(), 
        parent_category: "" 
      },
      { 
        category_name: "Control Cables", 
        category_slug: "control-cables", 
        short_description: "Flexible control, instrumentation, and measurement cables for automated processes.", 
        category_details: "<p>Flexible control, instrumentation, and measurement cables for automated processes.</p>",
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString(), 
        parent_category: "" 
      },
      { 
        category_name: "Telecommunication Cables", 
        category_slug: "telecom-cables", 
        short_description: "Fiber optic and copper communication cables for data transmission.", 
        category_details: "<p>Fiber optic and copper communication cables for data transmission.</p>",
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString(), 
        parent_category: "" 
      },
      { 
        category_name: "Specialty Wires", 
        category_slug: "specialty-wires", 
        short_description: "Custom engineered high-temperature and resistant wires for specific environments.", 
        category_details: "<p>Custom engineered high-temperature and resistant wires for specific environments.</p>",
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString(), 
        parent_category: "" 
      }
    ];

    const result = await collection.insertMany(categories);
    console.log(`${result.insertedCount} documents were inserted correctly.`);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
