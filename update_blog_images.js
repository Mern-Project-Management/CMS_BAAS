const { MongoClient } = require('mongodb');

async function updateBlogImages() {
  const uri = "mongodb+srv://harshit:Harshit%40123@userinfo.lmbsytd.mongodb.net/CMS";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('CMS');
    const collection = db.collection('blog');

    console.log('Updating blogs with generated images as arrays...');
    
    await collection.updateOne(
      { slug: "innovations-in-wire-drawing-technology" },
      { $set: { image: ["/uploads/wire_drawing.jpg"] } }
    );
    
    await collection.updateOne(
      { slug: "copper-vs-aluminum-choosing-the-right-wire" },
      { $set: { image: ["/uploads/copper_aluminum.jpg"] } }
    );

    await collection.updateOne(
      { slug: "quality-control-standards-in-cable-extrusion" },
      { $set: { image: ["/uploads/cable_extrusion.jpg"] } }
    );

    await collection.updateOne(
      { slug: "the-future-of-high-voltage-transmission-cables" },
      { $set: { image: ["/uploads/high_voltage.jpg"] } }
    );

    console.log('Successfully updated blog images as arrays.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

updateBlogImages();
