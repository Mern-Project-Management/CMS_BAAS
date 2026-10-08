const { MongoClient } = require('mongodb');

async function replaceBlogs() {
  const uri = "mongodb+srv://harshit:Harshit%40123@userinfo.lmbsytd.mongodb.net/CMS";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('CMS');
    const collection = db.collection('blog');

    console.log('Deleting existing blogs...');
    await collection.deleteMany({});
    
    console.log('Inserting 4 new wire industry blogs...');
    const now = new Date().toISOString();
    
    const newBlogs = [
      {
        title: "Innovations in Wire Drawing Technology",
        slug: "innovations-in-wire-drawing-technology",
        author: "Rajesh Sharma",
        date: "2026-10-10",
        image: "https://images.unsplash.com/photo-1616423641403-9e42e47ee2d7?q=80&w=1000&auto=format&fit=crop",
        details: "<p>Wire drawing technology has seen massive leaps in recent years. Modern drawing machines now incorporate advanced sensors and automation that allow for precise diameter control and high-speed production without compromising the structural integrity of the metal.</p><p>These innovations drastically reduce breakage and improve surface finish, making the final wire products more durable and suitable for demanding applications in aerospace, automotive, and construction sectors.</p>",
        meta_keyword: ["Wire Drawing", "Innovation", "Manufacturing"],
        created_at: now,
        updated_at: now
      },
      {
        title: "Copper vs. Aluminum: Choosing the Right Wire",
        slug: "copper-vs-aluminum-choosing-the-right-wire",
        author: "Amit Patel",
        date: "2026-09-28",
        image: "https://images.unsplash.com/photo-1558442074-3c19857bc1dc?q=80&w=1000&auto=format&fit=crop",
        details: "<p>The debate between using copper or aluminum wiring has been a cornerstone of electrical engineering for decades. Copper is renowned for its superior conductivity and tensile strength, making it ideal for residential and high-performance commercial applications.</p><p>On the other hand, aluminum is much lighter and significantly more cost-effective. Recent advancements in aluminum alloy formulations have solved many of the historical issues with thermal expansion, making it an excellent choice for large-scale power transmission.</p>",
        meta_keyword: ["Copper Wire", "Aluminum Wire", "Electrical"],
        created_at: now,
        updated_at: now
      },
      {
        title: "Quality Control Standards in Cable Extrusion",
        slug: "quality-control-standards-in-cable-extrusion",
        author: "Sneha Desai",
        date: "2026-08-15",
        image: "https://images.unsplash.com/photo-1565439390234-921312383c83?q=80&w=1000&auto=format&fit=crop",
        details: "<p>In the wire and cable industry, insulation is just as important as the conductor itself. Cable extrusion must meet rigorous international quality standards to ensure safety, durability, and resistance to environmental factors like heat, moisture, and chemicals.</p><p>Through laser diameter gauges, spark testers, and X-ray concentricity measurement systems, manufacturers can continuously monitor the extrusion process. This guarantees that every meter of cable produced can safely handle its rated voltage and physical stress.</p>",
        meta_keyword: ["Extrusion", "Quality Control", "Cable Manufacturing"],
        created_at: now,
        updated_at: now
      },
      {
        title: "The Future of High-Voltage Transmission Cables",
        slug: "the-future-of-high-voltage-transmission-cables",
        author: "Vikram Singh",
        date: "2026-07-22",
        image: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b6?q=80&w=1000&auto=format&fit=crop",
        details: "<p>As the global demand for renewable energy grows, the need to transport electricity efficiently over long distances has never been more critical. High-Voltage Direct Current (HVDC) cables are the future of national and international power grids.</p><p>These specialized cables minimize energy loss over vast distances and are key to connecting offshore wind farms and remote solar plants to major population centers. Ongoing research into new insulation materials promises even greater capacities in the years to come.</p>",
        meta_keyword: ["HVDC", "Power Grid", "High Voltage Cables"],
        created_at: now,
        updated_at: now
      }
    ];

    await collection.insertMany(newBlogs);
    console.log('Successfully added 4 new wire industry blogs.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

replaceBlogs();
