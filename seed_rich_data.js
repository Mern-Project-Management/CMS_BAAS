const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || "mongodb+srv://harshit:Harshit%40123@userinfo.lmbsytd.mongodb.net/CMS";
const client = new MongoClient(uri);

const generateShortDesc = (name) => `High-quality ${name.toLowerCase()} offering excellent performance, durability, and reliability for industrial applications.`;

const generateDetails = (name) => `
<p><strong>${name}</strong> are manufactured using premium materials and advanced processes to provide enhanced performance, resistance against harsh conditions, and exceptional durability. They are widely used in construction, power distribution, infrastructure, and demanding industrial applications.</p>
<p>Our ${name.toLowerCase()} are produced with precise dimensions, controlled quality standards, and consistent mechanical and electrical properties. They provide long-lasting protection and efficiency while maintaining the strength and flexibility required for challenging environments.</p>
<p>Available in different specifications, core configurations, tensile strengths, and finishes, these can be supplied exactly according to customer requirements and applicable international industry standards.</p>
<h4>Key Features</h4>
<ul>
<li>Excellent durability and corrosion resistance</li>
<li>High mechanical and tensile strength</li>
<li>Consistent dimensional accuracy</li>
<li>Long service life and reliability</li>
<li>Suitable for both indoor and outdoor industrial applications</li>
<li>Available in customized technical specifications</li>
<li>Adherence to global quality and safety standards</li>
</ul>
<h4>Applications</h4>
<ul>
<li>Power and Cable Manufacturing</li>
<li>Industrial Automation & Control Systems</li>
<li>Construction and Infrastructure Projects</li>
<li>Telecommunications and Data Transmission</li>
<li>Marine & Offshore Installations</li>
<li>Utility & Energy Infrastructure</li>
<li>Heavy-Duty Industrial Fabrication</li>
</ul>
`;

async function run() {
  try {
    await client.connect();
    const db = client.db("CMS");
    const categoriesCol = db.collection("categories");
    const productsCol = db.collection("our_products");
    
    // Update all categories
    const categories = await categoriesCol.find({}).toArray();
    for (const cat of categories) {
      const name = cat.category_name || "Industrial Products";
      await categoriesCol.updateOne(
        { _id: cat._id },
        { 
          $set: { 
            category_details: generateDetails(name),
            short_description: generateShortDesc(name),
            meta_description: generateShortDesc(name)
          } 
        }
      );
    }
    console.log(`Updated ${categories.length} categories.`);

    // Update all products
    const products = await productsCol.find({}).toArray();
    for (const prod of products) {
      const name = prod.name || prod.product_name || "Industrial Products";
      await productsCol.updateOne(
        { _id: prod._id },
        { 
          $set: { 
            details: generateDetails(name),
            short_description: generateShortDesc(name),
            meta_description: generateShortDesc(name)
          } 
        }
      );
    }
    console.log(`Updated ${products.length} products.`);

  } finally {
    await client.close();
  }
}

run().catch(console.dir);
