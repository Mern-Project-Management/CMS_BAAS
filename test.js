const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://harshit:Harshit%40123@userinfo.lmbsytd.mongodb.net/CMS';
const client = new MongoClient(uri);
async function run() {
  await client.connect();
  const db = client.db('CMS');
  const collections = await db.collection('collections').find({}).toArray();
  const faq = collections.find(c => c._id.toString() === '6a477a863042d14bb0be8de2' || c.name.toLowerCase().includes('faq'));
  console.log('FAQ Collection:', faq ? faq.name : 'Not found by ID either');
  await client.close();
}
run().catch(console.dir);
