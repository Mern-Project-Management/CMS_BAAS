/**
 * STEP-BY-STEP: Create Product Categories Schema Using Self-Reference
 * This creates the same structure as the Mongoose schema but with better scalability
 */

// ============================================
// STEP 1: Create the ProductCategory Collection
// ============================================

POST /api/collections
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "name": "product_categories",
  "display_name": "Product Categories",
  "description": "Product categories with SEO metadata and hierarchy",
  "icon": "folder-tree",
  "color": "blue"
}

// Response: { success: true, data: { id: "COLLECTION_ID", ... } }
// Copy COLLECTION_ID for next step


// ============================================
// STEP 2: Add All Fields to the Collection
// ============================================

// 1. Category Name (Required)
POST /api/fields
{
  "collection_id": "COLLECTION_ID",
  "name": "category",
  "display_name": "Category Name",
  "field_type": "Text",
  "is_required": true,
  "is_unique": true,
  "description": "Unique category name"
}

// 2. Photo/Image
POST /api/fields
{
  "collection_id": "COLLECTION_ID",
  "name": "photo",
  "display_name": "Category Photo",
  "field_type": "Image",
  "description": "Category image URL"
}

// 3. Alt Text
POST /api/fields
{
  "collection_id": "COLLECTION_ID",
  "name": "alt",
  "display_name": "Alt Text",
  "field_type": "Text",
  "description": "Image alt text for accessibility"
}

// 4. Image Title
POST /api/fields
{
  "collection_id": "COLLECTION_ID",
  "name": "imgtitle",
  "display_name": "Image Title",
  "field_type": "Text"
}

// 5. URL Slug
POST /api/fields
{
  "collection_id": "COLLECTION_ID",
  "name": "slug",
  "display_name": "URL Slug",
  "field_type": "Text",
  "is_unique": true,
  "description": "URL-friendly identifier"
}

// 6. URL
POST /api/fields
{
  "collection_id": "COLLECTION_ID",
  "name": "url",
  "display_name": "URL",
  "field_type": "Text",
  "description": "Full category URL"
}

// 7. Priority (for sitemap/sorting)
POST /api/fields
{
  "collection_id": "COLLECTION_ID",
  "name": "priority",
  "display_name": "Priority",
  "field_type": "Number",
  "description": "Display priority (0.0-1.0)"
}

// 8. Change Frequency (for SEO)
POST /api/fields
{
  "collection_id": "COLLECTION_ID",
  "name": "changeFreq",
  "display_name": "Change Frequency",
  "field_type": "Text",
  "description": "How often content changes (always, hourly, daily, weekly, monthly, yearly, never)"
}

// 9. Last Modified Date
POST /api/fields
{
  "collection_id": "COLLECTION_ID",
  "name": "lastmod",
  "display_name": "Last Modified",
  "field_type": "DateTime",
  "description": "Last modification date"
}

// ============================================
// SEO Meta Fields Group
// ============================================

// 10. Meta Title
POST /api/fields
{
  "collection_id": "COLLECTION_ID",
  "name": "metatitle",
  "display_name": "Meta Title",
  "field_type": "Text",
  "description": "SEO meta title tag"
}

// 11. Meta Description
POST /api/fields
{
  "collection_id": "COLLECTION_ID",
  "name": "metadescription",
  "display_name": "Meta Description",
  "field_type": "Text",
  "description": "SEO meta description tag"
}

// 12. Meta Keywords
POST /api/fields
{
  "collection_id": "COLLECTION_ID",
  "name": "metakeywords",
  "display_name": "Meta Keywords",
  "field_type": "Text",
  "description": "SEO meta keywords (comma-separated)"
}

// 13. Meta Canonical
POST /api/fields
{
  "collection_id": "COLLECTION_ID",
  "name": "metacanonical",
  "display_name": "Meta Canonical",
  "field_type": "Text",
  "description": "Canonical URL for duplicate prevention"
}

// 14. Meta Language
POST /api/fields
{
  "collection_id": "COLLECTION_ID",
  "name": "metalanguage",
  "display_name": "Meta Language",
  "field_type": "Text",
  "description": "Page language code (e.g., en, fr, es)"
}

// 15. Meta Schema
POST /api/fields
{
  "collection_id": "COLLECTION_ID",
  "name": "metaschema",
  "display_name": "Meta Schema",
  "field_type": "JSON",
  "description": "Structured data schema (JSON-LD)"
}

// 16. Other Meta Tags
POST /api/fields
{
  "collection_id": "COLLECTION_ID",
  "name": "otherMeta",
  "display_name": "Other Meta Tags",
  "field_type": "JSON",
  "description": "Additional meta tags as JSON"
}

// ============================================
// KEY FIELD: Parent Category (For Hierarchy)
// ============================================

// 17. Parent Category ID (Self-Reference) - THE CRUCIAL FIELD!
POST /api/fields
{
  "collection_id": "COLLECTION_ID",
  "name": "parent_id",
  "display_name": "Parent Category",
  "field_type": "Relation",
  "relation_to_collection": "COLLECTION_ID",
  "description": "Leave empty for top-level categories. Reference a parent category for sub-categories or sub-sub-categories."
}

// ============================================
// TIMESTAMPS
// ============================================

// 18. Created At
POST /api/fields
{
  "collection_id": "COLLECTION_ID",
  "name": "createdAt",
  "display_name": "Created At",
  "field_type": "DateTime"
}

// 19. Updated At
POST /api/fields
{
  "collection_id": "COLLECTION_ID",
  "name": "updatedAt",
  "display_name": "Updated At",
  "field_type": "DateTime"
}


// ============================================
// STEP 3: Create Sample Data
// ============================================

// Create Top-Level Category
POST /api/data/product_categories
{
  "category": "Electronics",
  "photo": "https://example.com/electronics.jpg",
  "alt": "Electronics category",
  "imgtitle": "Electronics",
  "slug": "electronics",
  "url": "/categories/electronics",
  "priority": 0.8,
  "changeFreq": "weekly",
  "metatitle": "Electronics - Shop the best electronics online",
  "metadescription": "Browse our wide selection of electronics including phones, laptops, and more",
  "metakeywords": "electronics, gadgets, phones, laptops",
  "metacanonical": "https://example.com/categories/electronics",
  "metalanguage": "en",
  "metaschema": {
    "@context": "https://schema.org",
    "@type": "Category",
    "name": "Electronics"
  },
  "parent_id": null
}

// Response: { success: true, data: { id: "ELECTRONICS_ID", ... } }
// Copy ELECTRONICS_ID


// Create Sub-Category (Parent: Electronics)
POST /api/data/product_categories
{
  "category": "Smartphones",
  "photo": "https://example.com/smartphones.jpg",
  "alt": "Smartphones",
  "imgtitle": "Smartphones",
  "slug": "smartphones",
  "url": "/categories/electronics/smartphones",
  "priority": 0.9,
  "changeFreq": "daily",
  "metatitle": "Best Smartphones - Electronics Category",
  "metadescription": "Find the latest smartphones and mobile devices",
  "metakeywords": "smartphones, phones, mobile devices",
  "metacanonical": "https://example.com/categories/electronics/smartphones",
  "metalanguage": "en",
  "parent_id": "ELECTRONICS_ID"
}

// Response: { success: true, data: { id: "SMARTPHONES_ID", ... } }
// Copy SMARTPHONES_ID


// Create Sub-Sub-Category (Parent: Smartphones)
POST /api/data/product_categories
{
  "category": "Android Phones",
  "photo": "https://example.com/android.jpg",
  "alt": "Android Phones",
  "imgtitle": "Android Phones",
  "slug": "android-phones",
  "url": "/categories/electronics/smartphones/android",
  "priority": 1.0,
  "changeFreq": "daily",
  "metatitle": "Android Phones - Best Selection",
  "metadescription": "Shop the latest Android smartphones",
  "metakeywords": "android, android phones, samsung, oneplus",
  "metacanonical": "https://example.com/categories/electronics/smartphones/android",
  "metalanguage": "en",
  "parent_id": "SMARTPHONES_ID"
}


// Create another Sub-Sub-Category
POST /api/data/product_categories
{
  "category": "iPhone",
  "photo": "https://example.com/iphone.jpg",
  "alt": "iPhone",
  "imgtitle": "iPhone",
  "slug": "iphone",
  "url": "/categories/electronics/smartphones/iphone",
  "priority": 1.0,
  "changeFreq": "daily",
  "metatitle": "iPhone - Official Apple Store",
  "metadescription": "Browse all iPhone models",
  "metakeywords": "iphone, apple, ios",
  "metacanonical": "https://example.com/categories/electronics/smartphones/iphone",
  "metalanguage": "en",
  "parent_id": "SMARTPHONES_ID"
}


// ============================================
// STEP 4: Query Your Hierarchy
// ============================================

// Get all top-level categories
GET /api/data/product_categories
// Add query: ?parent_id=null (if you want to filter)

// Get all subcategories of Electronics
GET /api/data/product_categories?parent_id=ELECTRONICS_ID

// Get all sub-sub-categories of Smartphones
GET /api/data/product_categories?parent_id=SMARTPHONES_ID

// Get full hierarchical tree
GET /api/hierarchies/COLLECTION_ID

// Get breadcrumb path (for Android Phones)
GET /api/breadcrumbs/COLLECTION_ID/ANDROID_PHONES_ID


// ============================================
// Expected Responses
// ============================================

// Full Tree Response from GET /api/hierarchies/COLLECTION_ID:
{
  "success": true,
  "data": [
    {
      "id": "ELECTRONICS_ID",
      "category": "Electronics",
      "slug": "electronics",
      "parent_id": null,
      "children": [
        {
          "id": "SMARTPHONES_ID",
          "category": "Smartphones",
          "slug": "smartphones",
          "parent_id": "ELECTRONICS_ID",
          "children": [
            {
              "id": "ANDROID_PHONES_ID",
              "category": "Android Phones",
              "slug": "android-phones",
              "parent_id": "SMARTPHONES_ID",
              "children": []
            },
            {
              "id": "IPHONE_ID",
              "category": "iPhone",
              "slug": "iphone",
              "parent_id": "SMARTPHONES_ID",
              "children": []
            }
          ]
        }
      ]
    }
  ]
}

// Breadcrumb Response from GET /api/breadcrumbs/COLLECTION_ID/ANDROID_PHONES_ID:
{
  "success": true,
  "data": [
    {
      "id": "ELECTRONICS_ID",
      "category": "Electronics",
      "slug": "electronics"
    },
    {
      "id": "SMARTPHONES_ID",
      "category": "Smartphones",
      "slug": "smartphones"
    },
    {
      "id": "ANDROID_PHONES_ID",
      "category": "Android Phones",
      "slug": "android-phones"
    }
  ]
}
