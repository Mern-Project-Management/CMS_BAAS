const { MongoClient } = require('mongodb');

async function main() {
    const uri = "mongodb+srv://harshitdhodirndtechnosoft:tl4aTMMScjLk4gWh@rnd.jasipfl.mongodb.net/ostech";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('ostech');
        const headings = await db.collection('heading').find({}).toArray();
        console.log("Headings:");
        console.log(JSON.stringify(headings.map(h => ({ id: h._id, section_name: h.section_name, heading: h.heading, tagline: h.tagline })), null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

main();
