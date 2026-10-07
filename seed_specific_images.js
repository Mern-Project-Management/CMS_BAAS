const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const srcDir = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\2b706391-2d26-40a4-992f-778993f51a53\\';
const destDir = 'd:\\HARSHIT\\Manufacturing_Web\\CMS_BAAS\\public\\uploads\\';

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

const updateMap = {
    "Single-Core Cable Armour Wire": "single_core_armour_wire",
    "Galvanized Steel Armour Strip": "galvanized_steel_armour_strip",
    "Galvanized Steel Armour Wire": "galvanized_steel_armour_wire"
};

async function run() {
    const uri = process.env.MONGODB_URI || "mongodb+srv://harshit:Harshit%40123@userinfo.lmbsytd.mongodb.net/CMS";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db("CMS");
        const collection = db.collection("our_products");
        
        const files = fs.readdirSync(srcDir);
        
        for (const [productName, prefix] of Object.entries(updateMap)) {
            const file = files.find(f => f.startsWith(prefix) && f.endsWith('.jpg'));
            if (file) {
                const srcPath = path.join(srcDir, file);
                const destPath = path.join(destDir, file);
                fs.copyFileSync(srcPath, destPath);
                console.log(`Copied ${file} to uploads`);
                
                const imageUrl = `/uploads/${file}`;
                
                // Update product(s) with this name
                const result = await collection.updateMany(
                    { name: productName },
                    { $set: { image: [imageUrl], img_title: productName, alt_name: productName } }
                );
                console.log(`Updated ${result.modifiedCount} product(s) named: ${productName}`);
            } else {
                console.log(`Image not found for prefix: ${prefix}`);
            }
        }
        console.log("All specific products updated with new images!");
        
    } finally {
        await client.close();
    }
}

run().catch(console.dir);
