const { MongoClient } = require('mongodb');

async function updateBlogFormat() {
  const uri = "mongodb+srv://harshit:Harshit%40123@userinfo.lmbsytd.mongodb.net/CMS";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('CMS');
    const collection = db.collection('blog');

    console.log('Updating blog with new format...');
    
    const htmlContent = `
<h2>The Growing Demand for High-Quality Wire in Modern Industries</h2>
<p><strong>Category:</strong> Industry Insights<br><strong>Reading Time:</strong> 5 min</p>
<p>Wire is an essential component across a wide range of modern industries, including construction, automotive, electrical, infrastructure, and engineering. As industries continue to demand stronger, more reliable, and precisely manufactured components, the importance of high-quality wire has increased significantly.</p>
<p>Modern wire manufacturing focuses on key factors such as dimensional accuracy, surface quality, tensile strength, flexibility, durability, and consistency. Advanced wire-drawing processes, high-quality raw materials, automated production systems, and stringent quality-control procedures enable manufacturers to produce wire that meets demanding industrial requirements.</p>
<p>The <strong>construction industry</strong> uses wire for reinforcement, fastening, fencing, structural applications, and various fabrication requirements. In the <strong>automotive sector</strong>, specialized wire is used in components, springs, cables, mechanical systems, and other critical applications. Similarly, <strong>electrical and electronics manufacturers</strong> require wire with excellent conductivity, durability, dimensional consistency, and compatibility with insulation systems.</p>
<p>Another major factor driving the wire industry is <strong>customization</strong>. Different applications require specific diameters, materials, surface finishes, tensile strengths, and mechanical properties. As a result, wire manufacturers are increasingly adopting flexible and advanced production capabilities to deliver application-specific solutions.</p>
<p>Quality assurance has also become increasingly important. Consistent testing and inspection throughout the manufacturing process help ensure that finished wire meets required dimensional, mechanical, and surface-quality standards. This consistency is particularly important for industries where reliability and long-term performance are critical.</p>
<p>As manufacturing technology continues to evolve, high-quality wire will remain an important foundation for industrial development. Manufacturers that combine advanced technology, reliable raw materials, precise production processes, and consistent quality can help customers achieve improved performance, greater reliability, and longer product life.</p>
<h3>Conclusion</h3>
<p>The growing demand for precision, durability, consistency, and application-specific performance is shaping the future of the wire industry. Continuous technological advancement, stringent quality control, and flexible manufacturing capabilities will remain key factors in meeting the evolving requirements of modern industries.</p>
    `;
    
    // We update the first blog, or we can update all of them
    await collection.updateMany(
      {},
      { $set: { details: htmlContent } }
    );

    console.log('Successfully updated all blogs with the new format.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

updateBlogFormat();
