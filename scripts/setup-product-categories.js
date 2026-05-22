/**
 * Automated Script to Create Product Categories Schema
 * 
 * Usage: 
 *   node scripts/setup-product-categories.js
 * 
 * Requirements:
 *   - jayshree_blogs API running on http://localhost:3000
 *   - Valid auth token (set in .env or hardcode for testing)
 */

const http = require('http');
const https = require('https');

// Configuration
const API_BASE = process.env.API_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'your-token-here';

const COLLECTION_NAME = 'product_categories';

// Color output for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

/**
 * Make HTTP/HTTPS request
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
    };

    const req = client.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Log with colors
 */
function log(message, type = 'info') {
  const prefix = {
    info: `${colors.blue}ℹ${colors.reset}`,
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
  }[type] || `${colors.blue}→${colors.reset}`;

  console.log(`${prefix} ${message}`);
}

/**
 * Create collection
 */
async function createCollection() {
  log('Creating product_categories collection...');

  const response = await makeRequest('POST', '/api/collections', {
    name: COLLECTION_NAME,
    display_name: 'Product Categories',
    description: 'Product categories with SEO metadata and hierarchy',
    icon: 'folder-tree',
    color: 'blue',
  });

  if (!response.data.success) {
    throw new Error(`Failed to create collection: ${response.data.error}`);
  }

  const collectionId = response.data.data.id;
  log(`Collection created with ID: ${collectionId}`, 'success');
  return collectionId;
}

/**
 * Create fields
 */
async function createFields(collectionId) {
  const fields = [
    {
      name: 'category',
      display_name: 'Category Name',
      field_type: 'Text',
      is_required: true,
      is_unique: true,
      description: 'Unique category name',
    },
    {
      name: 'photo',
      display_name: 'Category Photo',
      field_type: 'Image',
      description: 'Category image URL',
    },
    {
      name: 'alt',
      display_name: 'Alt Text',
      field_type: 'Text',
      description: 'Image alt text for accessibility',
    },
    {
      name: 'imgtitle',
      display_name: 'Image Title',
      field_type: 'Text',
    },
    {
      name: 'slug',
      display_name: 'URL Slug',
      field_type: 'Text',
      is_unique: true,
      description: 'URL-friendly identifier',
    },
    {
      name: 'url',
      display_name: 'URL',
      field_type: 'Text',
      description: 'Full category URL',
    },
    {
      name: 'priority',
      display_name: 'Priority',
      field_type: 'Number',
      description: 'Display priority (0.0-1.0)',
    },
    {
      name: 'changeFreq',
      display_name: 'Change Frequency',
      field_type: 'Text',
      description: 'How often content changes',
    },
    {
      name: 'lastmod',
      display_name: 'Last Modified',
      field_type: 'DateTime',
      description: 'Last modification date',
    },
    {
      name: 'metatitle',
      display_name: 'Meta Title',
      field_type: 'Text',
      description: 'SEO meta title tag',
    },
    {
      name: 'metadescription',
      display_name: 'Meta Description',
      field_type: 'Text',
      description: 'SEO meta description tag',
    },
    {
      name: 'metakeywords',
      display_name: 'Meta Keywords',
      field_type: 'Text',
      description: 'SEO meta keywords',
    },
    {
      name: 'metacanonical',
      display_name: 'Meta Canonical',
      field_type: 'Text',
      description: 'Canonical URL',
    },
    {
      name: 'metalanguage',
      display_name: 'Meta Language',
      field_type: 'Text',
      description: 'Page language code',
    },
    {
      name: 'metaschema',
      display_name: 'Meta Schema',
      field_type: 'JSON',
      description: 'Structured data schema',
    },
    {
      name: 'otherMeta',
      display_name: 'Other Meta Tags',
      field_type: 'JSON',
      description: 'Additional meta tags',
    },
    {
      name: 'parent_id',
      display_name: 'Parent Category',
      field_type: 'Relation',
      relation_to_collection: collectionId,
      description: 'Parent category for hierarchy',
    },
    {
      name: 'createdAt',
      display_name: 'Created At',
      field_type: 'DateTime',
    },
    {
      name: 'updatedAt',
      display_name: 'Updated At',
      field_type: 'DateTime',
    },
  ];

  log(`Creating ${fields.length} fields...`);

  for (const field of fields) {
    const response = await makeRequest('POST', '/api/fields', {
      collection_id: collectionId,
      ...field,
    });

    if (!response.data.success) {
      log(
        `Warning: Field ${field.name} may not have created properly`,
        'warn'
      );
      continue;
    }

    log(`Field created: ${field.display_name}`, 'success');
  }

  log('All fields created', 'success');
}

/**
 * Create sample data
 */
async function createSampleData(collectionId) {
  log('Creating sample category hierarchy...');

  const sampleData = [
    {
      category: 'Electronics',
      photo: 'https://example.com/electronics.jpg',
      alt: 'Electronics category',
      imgtitle: 'Electronics',
      slug: 'electronics',
      url: '/categories/electronics',
      priority: 0.8,
      changeFreq: 'weekly',
      metatitle: 'Electronics - Shop the best electronics online',
      metadescription: 'Browse our wide selection of electronics',
      metakeywords: 'electronics, gadgets, phones',
      metacanonical: 'https://example.com/categories/electronics',
      metalanguage: 'en',
      metaschema: {
        '@context': 'https://schema.org',
        '@type': 'Category',
        name: 'Electronics',
      },
      parent_id: null,
    },
  ];

  // Create top-level category
  let response = await makeRequest(
    'POST',
    `/api/data/${COLLECTION_NAME}`,
    sampleData[0]
  );

  if (!response.data.success) {
    log('Warning: Failed to create sample data', 'warn');
    return;
  }

  const electronicsId = response.data.data.id;
  log('Top-level category created: Electronics', 'success');

  // Create sub-category
  response = await makeRequest('POST', `/api/data/${COLLECTION_NAME}`, {
    category: 'Smartphones',
    photo: 'https://example.com/smartphones.jpg',
    alt: 'Smartphones',
    slug: 'smartphones',
    url: '/categories/electronics/smartphones',
    priority: 0.9,
    changeFreq: 'daily',
    metatitle: 'Best Smartphones - Electronics Category',
    metadescription: 'Find the latest smartphones',
    metakeywords: 'smartphones, phones, mobile',
    metacanonical: 'https://example.com/categories/electronics/smartphones',
    metalanguage: 'en',
    parent_id: electronicsId,
  });

  if (!response.data.success) {
    log('Warning: Failed to create subcategory', 'warn');
    return;
  }

  const smartphonesId = response.data.data.id;
  log('Sub-category created: Smartphones', 'success');

  // Create sub-sub-categories
  const subSubCategories = [
    {
      category: 'Android Phones',
      slug: 'android-phones',
      url: '/categories/electronics/smartphones/android',
      metakeywords: 'android, samsung, oneplus',
    },
    {
      category: 'iPhone',
      slug: 'iphone',
      url: '/categories/electronics/smartphones/iphone',
      metakeywords: 'iphone, apple, ios',
    },
  ];

  for (const subSub of subSubCategories) {
    await makeRequest('POST', `/api/data/${COLLECTION_NAME}`, {
      category: subSub.category,
      photo: `https://example.com/${subSub.slug}.jpg`,
      alt: subSub.category,
      slug: subSub.slug,
      url: subSub.url,
      priority: 1.0,
      changeFreq: 'daily',
      metatitle: `${subSub.category} - Best Selection`,
      metadescription: `Shop the latest ${subSub.category}`,
      metakeywords: subSub.metakeywords,
      metacanonical: `https://example.com${subSub.url}`,
      metalanguage: 'en',
      parent_id: smartphonesId,
    });

    log(`Sub-sub-category created: ${subSub.category}`, 'success');
  }

  log('Sample data created successfully', 'success');
}

/**
 * Main setup function
 */
async function setup() {
  try {
    console.log(
      `\n${colors.blue}🚀 Setting up Product Categories Schema${colors.reset}\n`
    );

    const collectionId = await createCollection();
    await createFields(collectionId);
    await createSampleData(collectionId);

    console.log(`
${colors.green}✓ Setup Complete!${colors.reset}

${colors.blue}Next Steps:${colors.reset}
1. Test your API:
   GET ${API_BASE}/api/hierarchies/${collectionId}
   
2. View sample data:
   GET ${API_BASE}/api/data/${COLLECTION_NAME}
   
3. Create more categories:
   POST ${API_BASE}/api/data/${COLLECTION_NAME}
   
4. Use in your frontend:
   - Import HierarchicalSelector component
   - Query via /api/hierarchies endpoint
   
${colors.blue}Collection ID: ${collectionId}${colors.reset}
`);
  } catch (error) {
    log(`Setup failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run setup
setup();
