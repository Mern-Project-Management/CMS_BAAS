const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env' });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'CMS';
const COLLECTION_NAME = 'manage-meta';

async function setup() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db(dbName);
    const nowIso = new Date().toISOString();

    // 1. Create Collection
    const collectionsCol = db.collection('collections');
    let collectionDoc = await collectionsCol.findOne({ name: COLLECTION_NAME });

    if (!collectionDoc) {
      const insertDoc = {
        name: COLLECTION_NAME,
        display_name: 'Manage Meta',
        description: 'SEO Meta Data for Static Pages',
        icon: 'search',
        color: '#10B981',
        created_at: nowIso,
        updated_at: nowIso,
      };
      const result = await collectionsCol.insertOne(insertDoc);
      collectionDoc = { _id: result.insertedId, ...insertDoc };
      console.log('Collection created:', result.insertedId);
    } else {
      console.log('Collection already exists:', collectionDoc._id);
    }

    const collectionId = collectionDoc._id.toString();

    // 2. Create Fields
    const fieldsCol = db.collection('fields');
    const fieldsToCreate = [
      { name: 'slug', display_name: 'Slug', field_type: 'Text', is_required: true, is_unique: true, description: 'e.g. /about-us' },
      { name: 'meta_title', display_name: 'Meta Title', field_type: 'Text' },
      { name: 'meta_description', display_name: 'Meta Description', field_type: 'Text' },
      { name: 'keywords', display_name: 'Keywords', field_type: 'Text' },
      { name: 'schema', display_name: 'Schema (JSON)', field_type: 'JSON' }
    ];

    let order = 0;
    for (const field of fieldsToCreate) {
      const existingField = await fieldsCol.findOne({ collection_id: collectionId, name: field.name });
      if (!existingField) {
        await fieldsCol.insertOne({
          collection_id: collectionId,
          ...field,
          field_order: order++,
          created_at: nowIso,
          updated_at: nowIso,
        });
        console.log(`Field created: ${field.name}`);
      } else {
        console.log(`Field already exists: ${field.name}`);
        order++;
      }
    }

    // 3. Pre-seed Static Pages
    const pages = [
      {
        slug: '/',
        meta_title: 'Ostech | Premium Packaging Machinery & Conveyor Manufacturer',
        meta_description: 'Ostech is a leading manufacturer of premium packaging machinery, conveyor systems, case packers, and custom industrial automation solutions in India.',
        keywords: 'conveyor manufacturer, case packer manufacturer, packaging machinery, industrial conveyors, ostech, automation solutions, machine manufacturing company',
        schema: {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Ostech Home",
          "url": "https://www.ostech.com/",
          "description": "Leading manufacturer of premium packaging machinery and conveyor systems."
        }
      },
      {
        slug: '/about-us',
        meta_title: 'About Ostech | Trusted Packaging Machinery & Conveyor Company',
        meta_description: 'Learn about Ostech, a leading packaging machinery and conveyor manufacturing company committed to innovation, precision engineering, and custom automation.',
        keywords: 'about ostech, conveyor company, packaging machinery industry, industrial machine manufacturer',
        schema: {
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About Ostech",
          "url": "https://www.ostech.com/about-us"
        }
      },
      {
        slug: '/our-capabilities',
        meta_title: 'Our Capabilities | Precision Machinery & Automation | Ostech',
        meta_description: 'Discover Ostech\'s advanced manufacturing capabilities, high-speed conveyor systems, precision case packers, and custom automation design.',
        keywords: 'manufacturing capabilities, custom conveyors, case packer automation, industrial automation, ostech capabilities',
        schema: {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Our Capabilities",
          "url": "https://www.ostech.com/our-capabilities"
        }
      },
      {
        slug: '/products',
        meta_title: 'Packaging Machinery & Conveyors | Ostech Products',
        meta_description: 'Explore Ostech\'s range of packaging machines, advanced conveyor systems, case packers, and custom product handling automation.',
        keywords: 'industrial conveyors, case packers, packaging machines, product handling, custom machinery',
        schema: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Ostech Products",
          "url": "https://www.ostech.com/products",
          "mainEntity": {
            "@type": "ItemList",
            "name": "Packaging Machinery & Conveyors"
          }
        }
      },
      {
        slug: '/categories',
        meta_title: 'Machinery Categories | Conveyors, Case Packers & Packers | Ostech',
        meta_description: 'Browse our industrial machinery product categories including custom conveyor systems, automated case packers, and end-of-line packaging systems.',
        keywords: 'conveyor categories, case packer categories, packaging machines, industrial automation categories',
        schema: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Machinery Categories",
          "url": "https://www.ostech.com/categories"
        }
      },
      {
        slug: '/blogs',
        meta_title: 'Packaging & Automation Industry Insights | Ostech Blog',
        meta_description: 'Stay updated with the latest packaging machinery trends, conveyor innovations, automation advancements, and engineering guides from Ostech.',
        keywords: 'packaging industry blog, conveyor system insights, automation news, machine engineering',
        schema: {
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "Ostech Blog",
          "url": "https://www.ostech.com/blogs"
        }
      },
      {
        slug: '/contact',
        meta_title: 'Contact Ostech | Packaging Machinery & Conveyor Experts',
        meta_description: 'Get in touch with Ostech for packaging machinery inquiries, custom conveyor requirements, automation support, and business partnerships.',
        keywords: 'contact ostech, conveyor supplier contact, packaging machine manufacturer contact',
        schema: {
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "Contact Ostech",
          "url": "https://www.ostech.com/contact"
        }
      },
      {
        slug: '/resources',
        meta_title: 'Industrial Resources, Catalogues & Manuals | Ostech',
        meta_description: 'Access Ostech product catalogues, machinery brochures, operational manuals, and engineering resources for conveyors and case packers.',
        keywords: 'machinery resources, conveyor catalogue, case packer manual, engineering guides',
        schema: {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Resources",
          "url": "https://www.ostech.com/resources"
        }
      },
      {
        slug: '/terms-and-conditions',
        meta_title: 'Terms & Conditions | Ostech',
        meta_description: 'Read the terms and conditions governing the use of Ostech website, products, automation services, and customer agreements.',
        keywords: 'terms and conditions, ostech policies, website terms',
        schema: {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Terms and Conditions",
          "url": "https://www.ostech.com/terms-and-conditions"
        }
      }
    ];

    const dataCol = db.collection(COLLECTION_NAME);
    const activeSlugs = pages.map(p => p.slug);

    // Delete non-existing pages metadata
    const deleteResult = await dataCol.deleteMany({ slug: { $nin: activeSlugs } });
    if (deleteResult.deletedCount > 0) {
      console.log(`Removed ${deleteResult.deletedCount} non-existing pages metadata entries`);
    }

    for (const page of pages) {
      const existingPage = await dataCol.findOne({ slug: page.slug });
      if (!existingPage) {
        await dataCol.insertOne({
          ...page,
          created_at: nowIso,
          updated_at: nowIso,
        });
        console.log(`Page metadata created: ${page.slug}`);
      } else {
        await dataCol.updateOne(
          { slug: page.slug },
          { $set: { ...page, updated_at: nowIso } }
        );
        console.log(`Page metadata updated: ${page.slug}`);
      }
    }

    console.log('Setup complete!');
  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    await client.close();
  }
}

setup();
