const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || "mongodb+srv://harshit:Harshit%40123@userinfo.lmbsytd.mongodb.net/CMS";
const client = new MongoClient(uri);

const pagesToSeed = [
    { title: "Products", page: "/products" },
    { title: "Categories", page: "/categories" },
    { title: "Blogs", page: "/blogs" },
    { title: "Services", page: "/services" },
    { title: "Contact Us", page: "/contact" },
    { title: "Global Presence", page: "/global-presence" },
    { title: "Infrastructure", page: "/manufacturing-infrastructure" },
    { title: "Quality & Certifications", page: "/quality-certification" },
    { title: "Industry Solutions", page: "/industry-solutions" },
    { title: "Downloads", page: "/downloads" },
    { title: "Events", page: "/events" },
    { title: "Careers", page: "/careers" }
];

async function run() {
    try {
        await client.connect();
        const db = client.db("CMS");
        const bannerCol = db.collection("banner");
        
        // Find existing banners to avoid duplicates
        const existingBanners = await bannerCol.find({}).toArray();
        const existingPages = new Set(existingBanners.map(b => b.page));
        
        const newBanners = [];
        const now = new Date().toISOString();
        
        for (const p of pagesToSeed) {
            if (!existingPages.has(p.page)) {
                newBanners.push({
                    title: p.title,
                    page: p.page,
                    image: ["/uploads/default_banner.jpg"],
                    created_at: now,
                    updated_at: now,
                    altname: p.title,
                    imgtitle: p.title
                });
            }
        }
        
        if (newBanners.length > 0) {
            const result = await bannerCol.insertMany(newBanners);
            console.log(`Inserted ${result.insertedCount} new banners.`);
        } else {
            console.log("No new banners to insert (all exist).");
        }
        
    } finally {
        await client.close();
    }
}
run().catch(console.dir);
