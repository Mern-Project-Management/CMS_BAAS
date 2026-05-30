# 🚀 Quick Reference: Product Categories Schema

**Print this out or save as a bookmark!**

---

## Setup (One-Time)

```bash
# Auto-setup everything
node scripts/setup-product-categories.js

# Response includes COLLECTION_ID
# Save this! You'll need it for all API calls below
```

---

## Key Concepts (Remember These!)

| Concept | Example | Used For |
|---------|---------|----------|
| **parent_id** | `null` for top-level | Determines if category is main/sub/sub-sub |
| **null parent** | `parent_id: null` | Top-level categories (Electronics, Clothing) |
| **Non-null parent** | `parent_id: "123abc"` | Sub-categories that belong to a parent |
| **COLLECTION_ID** | `66a4f2b1c3d...` | Used in all API endpoints |

---

## 5-Minute Crash Course

```javascript
// Creating categories:
POST /api/data/product_categories
{
  "category": "Smartphones",
  "parent_id": null,  // ← Top-level
  "slug": "smartphones",
  "priority": 0.9
}

// Creating SUB-category:
POST /api/data/product_categories
{
  "category": "Android Phones",
  "parent_id": "SMARTPHONES_ID",  // ← Reference parent!
  "slug": "android-phones",
  "priority": 1.0
}

// Query top-level only:
GET /api/data/product_categories?parent_id=null

// Query children of a parent:
GET /api/data/product_categories?parent_id=SMARTPHONES_ID

// Get full tree:
GET /api/hierarchies/COLLECTION_ID

// Get breadcrumb path:
GET /api/breadcrumbs/COLLECTION_ID/ANDROID_PHONES_ID
```

---

## Common Queries

### Get All Top-Level Categories
```bash
curl https://branduntold.vercel.app/api/data/product_categories?parent_id=null \
  -H "Authorization: Bearer TOKEN"
```
**Response**: All categories where parent_id is null

---

### Get Subcategories of "Electronics"
```bash
curl "https://branduntold.vercel.app/api/data/product_categories?parent_id=ELECTRONICS_ID" \
  -H "Authorization: Bearer TOKEN"
```
**Response**: All categories with parent_id = ELECTRONICS_ID

---

### Get Complete Hierarchy Tree
```bash
curl https://branduntold.vercel.app/api/hierarchies/COLLECTION_ID \
  -H "Authorization: Bearer TOKEN"
```
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "category": "Electronics",
      "parent_id": null,
      "children": [
        {
          "id": "...",
          "category": "Smartphones",
          "parent_id": "...",
          "children": [
            {
              "id": "...",
              "category": "Android Phones",
              "children": []
            }
          ]
        }
      ]
    }
  ]
}
```

---

### Get Breadcrumb Path (for URLs)
```bash
curl https://branduntold.vercel.app/api/breadcrumbs/COLLECTION_ID/ANDROID_PHONES_ID \
  -H "Authorization: Bearer TOKEN"
```
**Response**: Path from root to Android Phones
```json
{
  "success": true,
  "data": [
    { "id": "...", "category": "Electronics", "slug": "electronics" },
    { "id": "...", "category": "Smartphones", "slug": "smartphones" },
    { "id": "...", "category": "Android Phones", "slug": "android-phones" }
  ]
}
```

---

## Create Full Hierarchy (Step-by-Step)

### Step 1: Top-Level
```bash
curl -X POST https://branduntold.vercel.app/api/data/product_categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"category":"Electronics","parent_id":null,"slug":"electronics"}'
  
# Response: { "id": "CAT_1", ... }
# Save CAT_1
```

### Step 2: Sub-Category
```bash
curl -X POST https://branduntold.vercel.app/api/data/product_categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"category":"Smartphones","parent_id":"CAT_1","slug":"smartphones"}'
  
# Response: { "id": "CAT_2", ... }
# Save CAT_2
```

### Step 3: Sub-Sub-Category
```bash
curl -X POST https://branduntold.vercel.app/api/data/product_categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"category":"Android","parent_id":"CAT_2","slug":"android"}'
```

---

## All 19 Fields (Available in Schema)

```javascript
{
  // Basic Info
  category: String,        // Category name (required, unique)
  slug: String,            // URL slug (required, unique)
  url: String,             // Full URL
  
  // Image/Media
  photo: String,           // Image URL
  alt: String,             // Alt text
  imgtitle: String,        // Image title
  
  // SEO Meta Tags
  metatitle: String,       // <title> tag
  metadescription: String, // <meta> description
  metakeywords: String,    // Keywords
  metacanonical: String,   // Canonical URL
  metalanguage: String,    // Language code
  metaschema: JSON,        // Structured data
  otherMeta: JSON,         // Additional meta
  
  // Sitemap/SEO
  priority: Number,        // 0.0 to 1.0
  changeFreq: String,      // always|hourly|daily|weekly|monthly|yearly|never
  lastmod: DateTime,       // Last modified
  
  // Hierarchy
  parent_id: String,       // Parent category ID (null for top-level)
  
  // Timestamps
  createdAt: DateTime,
  updatedAt: DateTime
}
```

---

## React Component Usage

### Use the Selector
```tsx
import { HierarchicalSelector } from '@/components/hierarchical-selector';

<HierarchicalSelector
  collectionId="YOUR_COLLECTION_ID"
  onSelect={(categoryId) => console.log(categoryId)}
  label="Select Category"
/>
```

### Use the Breadcrumb
```tsx
import { HierarchicalBreadcrumb } from '@/components/hierarchical-breadcrumb';

<HierarchicalBreadcrumb
  collectionId="YOUR_COLLECTION_ID"
  recordId="ANDROID_PHONES_ID"
  onNavigate={(id) => router.push(`/categories/${id}`)}
/>
```

---

## Field Types Reference

| Field | Type | Notes |
|-------|------|-------|
| category | Text | Main category name |
| photo | Image | Image file |
| alt | Text | Short text |
| slug | Text | Must be unique |
| metatitle | Text | 50-60 chars |
| metadescription | Text | 150-160 chars |
| metakeywords | Text | Comma-separated |
| metaschema | JSON | Valid JSON object |
| otherMeta | JSON | Valid JSON object |
| priority | Number | 0.0 to 1.0 |
| lastmod | DateTime | Auto-formatted |
| parent_id | Relation | Links to same collection |

---

## Troubleshooting

### "Collection not found"
```bash
# Check collection exists
curl https://branduntold.vercel.app/api/collections \
  -H "Authorization: Bearer TOKEN"
# Find your product_categories in the list
```

### "Invalid parent_id"
```bash
# Make sure parent_id exists
# Use null for top-level, not empty string
"parent_id": null  ✅
"parent_id": ""    ❌
```

### "Unique constraint violated"
```bash
# category and slug must be unique
# Change the value or use different parent_id
```

### No results from hierarchy query
```bash
# Check if data was actually created
GET /api/data/product_categories
# Should show your categories
```

---

## Hierarchy Examples

### 2-Level (Blog Categories)
```
Technology (parent: null)
├── Web Development (parent: Technology)
├── Mobile Apps (parent: Technology)
└── AI/ML (parent: Technology)
```

### 3-Level (Product Categories)
```
Electronics (parent: null)
├── Computers (parent: Electronics)
│   ├── Laptops (parent: Computers)
│   └── Desktops (parent: Computers)
└── Mobile (parent: Electronics)
    ├── Smartphones (parent: Mobile)
    └── Tablets (parent: Mobile)
```

### 4-Level (Complex Hierarchy)
```
Vehicles (parent: null)
├── Cars (parent: Vehicles)
│   ├── Sedan (parent: Cars)
│   │   ├── Luxury (parent: Sedan)
│   │   └── Economy (parent: Sedan)
│   └── SUV (parent: Cars)
└── Motorcycles (parent: Vehicles)
```

---

## Performance Tips

1. ✅ Add MongoDB indexes
   ```javascript
   db.product_categories.createIndex({ parent_id: 1 })
   db.product_categories.createIndex({ slug: 1 }, { unique: true })
   ```

2. ✅ Cache the hierarchy tree
   ```typescript
   // Cache for 1 hour
   redis.setex(`categories:tree`, 3600, JSON.stringify(tree))
   ```

3. ✅ Use breadcrumbs instead of recursive queries
   ```bash
   # Fast: single query
   GET /api/breadcrumbs/COLLECTION_ID/RECORD_ID
   
   # Slow: multiple queries
   GET /api/data/product_categories?parent_id=ID_1
   GET /api/data/product_categories?parent_id=ID_2
   ```

---

## Linking Products to Categories

```javascript
// Create products collection first
POST /api/collections
{
  "name": "products",
  "display_name": "Products"
}

// Add category_id field (Relation type)
POST /api/fields
{
  "collection_id": "PRODUCTS_COLLECTION_ID",
  "name": "category_id",
  "display_name": "Category",
  "field_type": "Relation",
  "relation_to_collection": "CATEGORIES_COLLECTION_ID"
}

// Create product linked to category
POST /api/data/products
{
  "name": "Samsung Galaxy S24",
  "category_id": "ANDROID_PHONES_ID",
  "price": 999.99
}

// Query products by category
GET /api/data/products?category_id=ANDROID_PHONES_ID
```

---

## Environment Variables

Save in `.env.local`:
```
NEXT_PUBLIC_API_URL=https://branduntold.vercel.app
AUTH_TOKEN=your_token_here

# For setup script
API_URL=https://branduntold.vercel.app
```

---

## Common Tasks

| Task | Endpoint | Method |
|------|----------|--------|
| Create category | `/api/data/product_categories` | POST |
| Update category | `/api/data/product_categories/{id}` | PUT |
| Delete category | `/api/data/product_categories/{id}` | DELETE |
| Get all top-level | `/api/data/product_categories?parent_id=null` | GET |
| Get children | `/api/data/product_categories?parent_id={id}` | GET |
| Get tree | `/api/hierarchies/{collectionId}` | GET |
| Get breadcrumb | `/api/breadcrumbs/{collectionId}/{recordId}` | GET |

---

## Import: Before Setup

```typescript
// lib/types.ts
export interface Category {
  id: string;
  category: string;
  slug: string;
  parent_id: string | null;
  photo?: string;
  priority?: number;
  metatitle?: string;
  metadescription?: string;
  // ... other fields
}
```

---

## Quick Start (Copy-Paste)

```bash
# 1. Setup
node scripts/setup-product-categories.js

# 2. Get collection ID from response
COLLECTION_ID="YOUR_ID_HERE"

# 3. Get full tree
curl https://branduntold.vercel.app/api/hierarchies/$COLLECTION_ID \
  -H "Authorization: Bearer TOKEN"

# 4. You're done! Use in components
```

---

**Bookmark this page!** 📌

All files in: `d:\Master_Backend\jayshree_blogs_BAAS\`
