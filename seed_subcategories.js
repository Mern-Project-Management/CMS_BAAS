const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || "mongodb+srv://harshit:Harshit%40123@userinfo.lmbsytd.mongodb.net/CMS";
const client = new MongoClient(uri);

const subCategoriesData = {
  "Industrial Cables": [
    { name: "Armoured Cables", slug: "armoured-cables", desc: "Steel wire or tape armoured cables for mechanical protection." },
    { name: "Unarmoured Cables", slug: "unarmoured-cables", desc: "Flexible cables without armour for standard industrial use." },
    { name: "Mining Cables", slug: "mining-cables", desc: "Tough rubber sheathed cables for mining equipment." }
  ],
  "Power Cables": [
    { name: "Low Voltage Power Cables", slug: "lv-power-cables", desc: "Up to 1kV power cables for building wire and infrastructure." },
    { name: "Medium Voltage Power Cables", slug: "mv-power-cables", desc: "3kV to 36kV cables for primary distribution networks." },
    { name: "High Voltage Power Cables", slug: "hv-power-cables", desc: "Above 36kV transmission cables." }
  ],
  "Control Cables": [
    { name: "Shielded Control Cables", slug: "shielded-control-cables", desc: "Braided or foil shielded to prevent electromagnetic interference." },
    { name: "Unshielded Control Cables", slug: "unshielded-control-cables", desc: "Standard multi-core cables for signal transmission." }
  ],
  "Telecommunication Cables": [
    { name: "Fiber Optic Cables", slug: "fiber-optic-cables", desc: "High-speed light transmission cables." },
    { name: "Coaxial Cables", slug: "coaxial-cables", desc: "Radio frequency transmission cables." },
    { name: "LAN Data Cables", slug: "lan-data-cables", desc: "Cat5e, Cat6, and Cat7 networking cables." }
  ],
  "Specialty Wires": [
    { name: "Fire Resistant Cables", slug: "fire-resistant-cables", desc: "Cables that maintain circuit integrity during fire." },
    { name: "Marine & Offshore Cables", slug: "marine-cables", desc: "Halogen-free mud resistant cables for ships and rigs." },
    { name: "Solar Cables", slug: "solar-cables", desc: "UV and weather resistant DC cables for photovoltaic systems." }
  ]
};

async function run() {
  try {
    await client.connect();
    const db = client.db("CMS");
    const collection = db.collection("categories");
    
    // Find the 5 main categories
    const parents = await collection.find({ category_name: { $in: Object.keys(subCategoriesData) } }).toArray();
    
    const docsToInsert = [];

    for (const parent of parents) {
      const subs = subCategoriesData[parent.category_name];
      if (subs) {
        for (const sub of subs) {
          docsToInsert.push({
            category_name: sub.name,
            category_slug: sub.slug,
            short_description: sub.desc,
            category_details: `<p>${sub.desc}</p>`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            parent_category: parent._id.toString()
          });
        }
      }
    }

    if (docsToInsert.length > 0) {
      const result = await collection.insertMany(docsToInsert);
      console.log(`Successfully inserted ${result.insertedCount} subcategories.`);
    } else {
      console.log("No subcategories generated. Check if parents exist.");
    }
    
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
