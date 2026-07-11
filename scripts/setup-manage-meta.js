const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env' });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'ostech';
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
        meta_title: 'Wiretex | Leading Wire & Cable Manufacturer in India',
        meta_description: 'Wiretex is a trusted wire and cable manufacturer in India, delivering premium industrial wires, customized cable solutions, advanced manufacturing, and global quality standards.',
        keywords: 'wire manufacturer india, cable manufacturer, industrial wire supplier, electrical wires, wiretex, cable solutions, wire manufacturing company',
        schema: {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Wiretex Home",
          "url": "https://www.wiretex.com/",
          "description": "Leading wire and cable manufacturer in India."
        }
      },
      {
        slug: '/about-us',
        meta_title: 'About Wiretex | Trusted Wire Manufacturing Company',
        meta_description: 'Learn about Wiretex, a leading wire manufacturing company committed to innovation, quality, precision engineering, and customer-focused wire solutions.',
        keywords: 'about wiretex, wire company, wire manufacturing industry, industrial wire manufacturer',
        schema: {
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About Wiretex",
          "url": "https://www.wiretex.com/about-us"
        }
      },
      {
        slug: '/products',
        meta_title: 'Wire & Cable Products | Industrial Wire Solutions',
        meta_description: 'Explore Wiretex product range including industrial wires, specialty cables, custom wire solutions, and high-performance electrical conductors.',
        keywords: 'industrial wires, electrical cables, specialty wire products, cable products, wire solutions',
        schema: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Wiretex Products",
          "url": "https://www.wiretex.com/products",
          "mainEntity": {
            "@type": "ItemList",
            "name": "Wire & Cable Products"
          }
        }
      },
      {
        slug: '/services',
        meta_title: 'Wire Manufacturing Services | Custom Cable Solutions',
        meta_description: 'Wiretex offers custom wire manufacturing, cable design, engineering support, quality testing, and industry-specific wire solutions.',
        keywords: 'wire manufacturing services, custom cables, wire engineering, cable testing services',
        schema: {
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Wire Manufacturing Services",
          "provider": {
            "@type": "Organization",
            "name": "Wiretex"
          }
        }
      },
      {
        slug: '/blogs',
        meta_title: 'Wire Industry Insights & Blogs | Wiretex',
        meta_description: 'Stay updated with the latest wire manufacturing trends, industry insights, technology innovations, and cable solution guides from Wiretex.',
        keywords: 'wire industry blog, cable manufacturing insights, electrical wire news, wire technology',
        schema: {
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "Wiretex Blog",
          "url": "https://www.wiretex.com/blogs"
        }
      },
      {
        slug: '/careers',
        meta_title: 'Careers at Wiretex | Join Our Manufacturing Team',
        meta_description: 'Explore career opportunities at Wiretex and become part of a growing team focused on innovation, engineering excellence, and manufacturing leadership.',
        keywords: 'wiretex careers, manufacturing jobs, engineering careers, wire industry jobs',
        schema: {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Careers",
          "url": "https://www.wiretex.com/careers"
        }
      },
      {
        slug: '/contact',
        meta_title: 'Contact Wiretex | Wire & Cable Manufacturing Experts',
        meta_description: 'Get in touch with Wiretex for wire manufacturing inquiries, custom cable requirements, technical support, and partnership opportunities.',
        keywords: 'contact wiretex, wire manufacturer contact, cable supplier contact',
        schema: {
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "Contact Wiretex",
          "url": "https://www.wiretex.com/contact"
        }
      },
      {
        slug: '/faq',
        meta_title: 'Frequently Asked Questions | Wiretex',
        meta_description: 'Find answers to common questions about Wiretex products, manufacturing capabilities, quality standards, certifications, and services.',
        keywords: 'wire faq, cable faq, wire manufacturing questions, wiretex support',
        schema: {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What products does Wiretex manufacture?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Wiretex manufactures industrial wires, specialty cables and custom cable solutions."
              }
            }
          ]
        }
      },
      {
        slug: '/global-presence',
        meta_title: 'Global Presence | International Wire Supply Network',
        meta_description: 'Discover Wiretex global presence, export capabilities, international partnerships, and worldwide delivery of premium wire solutions.',
        keywords: 'global wire supplier, wire exports, international cable manufacturer, global presence',
        schema: {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Wiretex Global Presence",
          "url": "https://www.wiretex.com/global-presence"
        }
      },
      {
        slug: '/industry-solutions',
        meta_title: 'Industry Solutions | Wire Applications Across Industries',
        meta_description: 'Wiretex provides specialized wire and cable solutions for automotive, infrastructure, energy, telecommunications, and industrial sectors.',
        keywords: 'industry wire solutions, automotive wires, energy cables, industrial wire applications',
        schema: {
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Industry Wire Solutions",
          "provider": {
            "@type": "Organization",
            "name": "Wiretex"
          }
        }
      },
      {
        slug: '/manufacturing-infrastructure',
        meta_title: 'Manufacturing Infrastructure | Advanced Wire Production',
        meta_description: 'Explore Wiretex state-of-the-art manufacturing infrastructure, modern machinery, quality control systems, and production excellence.',
        keywords: 'wire manufacturing plant, cable production facility, manufacturing infrastructure',
        schema: {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Manufacturing Infrastructure",
          "url": "https://www.wiretex.com/manufacturing-infrastructure"
        }
      },
      {
        slug: '/quality-certification',
        meta_title: 'Quality Certifications | Certified Wire Manufacturing',
        meta_description: 'Wiretex follows stringent quality standards and certifications to ensure reliable, safe, and high-performance wire and cable products.',
        keywords: 'quality certification, iso certified wire manufacturer, cable quality standards',
        schema: {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Quality Certifications",
          "url": "https://www.wiretex.com/quality-certification"
        }
      },
      {
        slug: '/team',
        meta_title: 'Leadership Team | Wiretex Manufacturing Experts',
        meta_description: 'Meet the experienced leadership and technical team driving innovation, quality, and customer success at Wiretex.',
        keywords: 'wiretex team, manufacturing experts, leadership team, engineering professionals',
        schema: {
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          "name": "Wiretex Team",
          "url": "https://www.wiretex.com/team"
        }
      },
      {
        slug: '/terms-and-conditions',
        meta_title: 'Terms & Conditions | Wiretex',
        meta_description: 'Read the terms and conditions governing the use of Wiretex website, products, services, and customer interactions.',
        keywords: 'terms and conditions, wiretex policies, website terms',
        schema: {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Terms and Conditions",
          "url": "https://www.wiretex.com/terms-and-conditions"
        }
      }
    ];

    const dataCol = db.collection(COLLECTION_NAME);
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
