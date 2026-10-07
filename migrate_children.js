const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || "mongodb+srv://harshit:Harshit%40123@userinfo.lmbsytd.mongodb.net/CMS";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db("CMS");
    const categoriesCol = db.collection("categories");
    const productsCol = db.collection("our_products");
    
    // Find all child categories (parent_category is not empty)
    const childCategories = await categoriesCol.find({ parent_category: { $ne: "" } }).toArray();
    
    if (childCategories.length === 0) {
      console.log("No child categories found to migrate.");
      return;
    }

    const newProducts = childCategories.map(child => ({
      category: child.parent_category,
      name: child.category_name,
      slug: child.category_slug,
      image: child.image ? [child.image] : [],
      details: child.category_details || `<p>Detailed specifications and information for ${child.category_name}.</p><ul><li>High quality manufacturing</li><li>Industrial grade reliability</li><li>Customizable specifications</li></ul>`,
      short_description: child.short_description || "",
      created_at: child.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      meta_description: child.short_description || "",
      metatitle: `${child.category_name} - Manufacturer & Supplier`,
    }));

    // Insert into our_products
    const insertResult = await productsCol.insertMany(newProducts);
    console.log(`Migrated ${insertResult.insertedCount} child categories to our_products.`);

    // Delete the child categories from categories collection
    const deleteResult = await categoriesCol.deleteMany({ parent_category: { $ne: "" } });
    console.log(`Deleted ${deleteResult.deletedCount} child categories from categories collection.`);
    
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
