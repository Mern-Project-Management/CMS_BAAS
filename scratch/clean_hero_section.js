const { MongoClient } = require('mongodb');

async function main() {
  const uri = "mongodb+srv://harshitdhodirndtechnosoft:tl4aTMMScjLk4gWh@rnd.jasipfl.mongodb.net/ostech";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('ostech');
    const col = db.collection('hero_section');

    console.log("Removing variations of 'imgtitle' and 'altname' from hero_section records...");
    const res = await col.updateMany(
      {},
      { 
        $unset: { 
          imgtitle: "", 
          Imgtitle: "", 
          ImgTitle: "", 
          altname: "", 
          Altname: "", 
          AltName: "" 
        } 
      }
    );
    console.log(`Matched: ${res.matchedCount}, Modified: ${res.modifiedCount}`);
    console.log("Clean up complete!");
  } finally {
    await client.close();
  }
}

main().catch(console.error);
