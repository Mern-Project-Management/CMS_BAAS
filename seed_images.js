const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const srcDir = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\2b706391-2d26-40a4-992f-778993f51a53\\';
const destDir = 'd:\\HARSHIT\\Manufacturing_Web\\CMS_BAAS\\public\\uploads\\';

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// Map logical names to the actual generated filenames
const categoryToImagePrefix = {
    "Industrial Cables": "industrial_cables",
    "Power Cables": "power_cables",
    "Control Cables": "control_cables",
    "Telecommunication Cables": "telecom_cables",
    "Specialty Wires": "specialty_wires"
};

async function run() {
    const uri = process.env.MONGODB_URI || "mongodb+srv://harshit:Harshit%40123@userinfo.lmbsytd.mongodb.net/CMS";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db("CMS");
        const collection = db.collection("categories");
        
        // 1. Copy images and update parent categories
        const files = fs.readdirSync(srcDir);
        
        const parentDocs = await collection.find({ parent_category: "" }).toArray();
        
        const parentImageMap = {}; // Maps parent _id to image path
        
        for (const parent of parentDocs) {
            const prefix = categoryToImagePrefix[parent.category_name];
            if (prefix) {
                // Find matching file
                const file = files.find(f => f.startsWith(prefix) && f.endsWith('.jpg'));
                if (file) {
                    const srcPath = path.join(srcDir, file);
                    const destPath = path.join(destDir, file);
                    fs.copyFileSync(srcPath, destPath);
                    console.log(`Copied ${file} to uploads`);
                    
                    const imageUrl = `/uploads/${file}`;
                    parentImageMap[parent._id.toString()] = imageUrl;
                    
                    // Update parent
                    await collection.updateOne(
                        { _id: parent._id },
                        { $set: { image: imageUrl, img_title: parent.category_name, alt_name: parent.category_name } }
                    );
                    console.log(`Updated parent: ${parent.category_name}`);
                }
            }
        }
        
        // 2. Update child categories to use their parent's image
        const childDocs = await collection.find({ parent_category: { $ne: "" } }).toArray();
        
        for (const child of childDocs) {
            const parentImgUrl = parentImageMap[child.parent_category];
            if (parentImgUrl) {
                await collection.updateOne(
                    { _id: child._id },
                    { $set: { image: parentImgUrl, img_title: child.category_name, alt_name: child.category_name } }
                );
                console.log(`Updated child: ${child.category_name} with parent image`);
            }
        }
        
        console.log("All categories updated with images!");
        
    } finally {
        await client.close();
    }
}

run().catch(console.dir);
