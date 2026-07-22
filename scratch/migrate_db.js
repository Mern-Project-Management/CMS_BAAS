const { MongoClient } = require('mongodb');

const MIGRATIONS = [
  { page: 'home-02', oldKey: 'Hero2', newKey: 'Hero Banner', newLabel: 'Hero Banner' },
  { page: 'home-02', oldKey: 'About9', newKey: 'About', newLabel: 'About' },
  { page: 'home-02', oldKey: 'Services9Wrapper', newKey: 'Category', newLabel: 'Category' },
  { page: 'home-02', oldKey: 'Portfolios6Wrapper', newKey: 'popular_products', newLabel: 'popular_products' },
  { page: 'home-02', oldKey: 'Brands4', newKey: 'Clients', newLabel: 'Clients' },
  { page: 'home-02', oldKey: 'Contact2', newKey: 'Global Presence', newLabel: 'Global Presence' },
  { page: 'home-02', oldKey: 'Testimonials6', newKey: 'testimonials', newLabel: 'testimonials' },
  { page: 'home-02', oldKey: 'Testimonials4', newKey: 'cta_form', newLabel: 'cta_form' },
  { page: 'home-02', oldKey: 'Faq1', newKey: 'FAQ', newLabel: 'FAQ' },
];

async function main() {
  const uri = "mongodb+srv://harshitdhodirndtechnosoft:tl4aTMMScjLk4gWh@rnd.jasipfl.mongodb.net/ostech";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('ostech');
    const col = db.collection('page_components');

    console.log("Starting DB key migration...");
    for (const mig of MIGRATIONS) {
      const res = await col.updateOne(
        { page: mig.page, key: mig.oldKey },
        { $set: { key: mig.newKey, label: mig.newLabel } }
      );
      if (res.modifiedCount > 0) {
        console.log(`Migrated: ${mig.oldKey} -> ${mig.newKey}`);
      } else {
        console.log(`No change or not found for: ${mig.oldKey}`);
      }
    }
    console.log("Migration complete!");
  } finally {
    await client.close();
  }
}

main().catch(console.error);
