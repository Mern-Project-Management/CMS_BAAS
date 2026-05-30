# 🚀 Quick Start: Implementing Relationships

This is a step-by-step guide to get relationships working in your jayshree_blogs within 30 minutes.

## What You'll Build

A **Category Hierarchy** where:
- Top-level categories (Electronics, Clothing, etc.)
- Sub-categories (Smartphones under Electronics)
- Sub-sub-categories (Android under Smartphones)

## Step 1: Prepare Your Database (2 minutes)

Make sure MongoDB is running and connected. Your project already supports this.

## Step 2: Create the Categories Collection (3 minutes)

### Using the UI:
1. Open your jayshree_blogs dashboard
2. Click "New Collection"
3. Fill in:
   - **Name**: `categories`
   - **Display Name**: `Categories`
   - **Description**: `Product categories with hierarchy`
   - **Icon**: `folder`
4. Click Create

### Or using API:
```bash
curl -X POST https://branduntold.vercel.app/api/collections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "categories",
    "display_name": "Categories",
    "description": "Product categories with hierarchy",
    "icon": "folder",
    "color": "blue"
  }'
```

**Response** (copy the collection ID):
```json
{
  "success": true,
  "data": {
    "id": "66a12345...",
    "name": "categories",
    ...
  }
}
```

## Step 3: Add Fields to Categories (5 minutes)

### Field 1: Name
```bash
curl -X POST https://branduntold.vercel.app/api/fields \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "collection_id": "YOUR_COLLECTION_ID",
    "name": "name",
    "display_name": "Category Name",
    "field_type": "Text",
    "is_required": true,
    "description": "The name of this category"
  }'
```

### Field 2: Parent Category (THE KEY FIELD FOR HIERARCHY)
```bash
curl -X POST https://branduntold.vercel.app/api/fields \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "collection_id": "YOUR_COLLECTION_ID",
    "name": "parent_id",
    "display_name": "Parent Category",
    "field_type": "Relation",
    "relation_to_collection": "YOUR_COLLECTION_ID",
    "description": "Leave empty for top-level categories",
    "is_required": false
  }'
```

### Field 3: Slug (for URLs)
```bash
curl -X POST https://branduntold.vercel.app/api/fields \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "collection_id": "YOUR_COLLECTION_ID",
    "name": "slug",
    "display_name": "URL Slug",
    "field_type": "Text",
    "is_unique": true,
    "description": "Unique URL-friendly identifier"
  }'
```

## Step 4: Create Sample Data (5 minutes)

### Top-level category:
```bash
curl -X POST https://branduntold.vercel.app/api/data/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Electronics",
    "parent_id": null,
    "slug": "electronics"
  }'
```

**Response** (copy this ID as ELECTRONICS_ID):
```json
{
  "success": true,
  "data": {
    "id": "66a98765...",
    "name": "Electronics",
    "parent_id": null,
    "slug": "electronics"
  }
}
```

### Sub-category:
```bash
curl -X POST https://branduntold.vercel.app/api/data/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Smartphones",
    "parent_id": "ELECTRONICS_ID",
    "slug": "smartphones"
  }'
```

**Response** (copy this ID as SMARTPHONES_ID):
```json
{
  "success": true,
  "data": {
    "id": "66a98766...",
    "name": "Smartphones",
    "parent_id": "66a98765...",
    "slug": "smartphones"
  }
}
```

### Sub-sub-category:
```bash
curl -X POST https://branduntold.vercel.app/api/data/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Android Phones",
    "parent_id": "SMARTPHONES_ID",
    "slug": "android-phones"
  }'
```

## Step 5: Test Your Hierarchy (3 minutes)

### Get all top-level categories:
```bash
curl https://branduntold.vercel.app/api/data/categories \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get all subcategories of Electronics:
```bash
curl "https://branduntold.vercel.app/api/data/categories?parent_id=ELECTRONICS_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get the full hierarchy tree:
```bash
curl https://branduntold.vercel.app/api/hierarchies/YOUR_COLLECTION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "66a98765...",
      "name": "Electronics",
      "parent_id": null,
      "slug": "electronics",
      "children": [
        {
          "id": "66a98766...",
          "name": "Smartphones",
          "parent_id": "66a98765...",
          "slug": "smartphones",
          "children": [
            {
              "id": "66a98767...",
              "name": "Android Phones",
              "parent_id": "66a98766...",
              "slug": "android-phones",
              "children": []
            }
          ]
        }
      ]
    }
  ]
}
```

## Step 6: Get Breadcrumb Path (1 minute)

Get the full path from root to Android Phones:
```bash
curl https://branduntold.vercel.app/api/breadcrumbs/YOUR_COLLECTION_ID/66a98767 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "66a98765...",
      "name": "Electronics",
      "slug": "electronics"
    },
    {
      "id": "66a98766...",
      "name": "Smartphones",
      "slug": "smartphones"
    },
    {
      "id": "66a98767...",
      "name": "Android Phones",
      "slug": "android-phones"
    }
  ]
}
```

## Step 7: Use in React Components (6 minutes)

### Use the Hierarchical Selector
```tsx
import { HierarchicalSelector } from '@/components/hierarchical-selector';

export function CategoryForm() {
  const [selectedCategory, setSelectedCategory] = useState('');

  return (
    <form>
      <HierarchicalSelector
        collectionId="YOUR_COLLECTION_ID"
        label="Parent Category"
        placeholder="Select parent category (leave empty for top-level)"
        value={selectedCategory}
        onSelect={setSelectedCategory}
        includeRootLevel={false}
      />
      <button type="submit">Create Category</button>
    </form>
  );
}
```

### Use the Breadcrumb Component
```tsx
import { HierarchicalBreadcrumb } from '@/components/hierarchical-breadcrumb';

export function CategoryView({ recordId }) {
  return (
    <div>
      <HierarchicalBreadcrumb
        collectionId="YOUR_COLLECTION_ID"
        recordId={recordId}
        onNavigate={(id) => router.push(`/categories/${id}`)}
      />
      {/* Category details here */}
    </div>
  );
}
```

## Step 8: Create Blog Collection (5 minutes)

Now create a separate Blog collection that references categories:

### Create blogs collection:
```bash
curl -X POST https://branduntold.vercel.app/api/collections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "blogs",
    "display_name": "Blog Posts",
    "description": "Blog posts linked to categories"
  }'
```

### Add title field:
```bash
curl -X POST https://branduntold.vercel.app/api/fields \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "collection_id": "BLOGS_COLLECTION_ID",
    "name": "title",
    "display_name": "Post Title",
    "field_type": "Text",
    "is_required": true
  }'
```

### Add category field (linking to categories):
```bash
curl -X POST https://branduntold.vercel.app/api/fields \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "collection_id": "BLOGS_COLLECTION_ID",
    "name": "category_id",
    "display_name": "Category",
    "field_type": "Relation",
    "relation_to_collection": "CATEGORIES_COLLECTION_ID",
    "is_required": true
  }'
```

### Create a blog post:
```bash
curl -X POST https://branduntold.vercel.app/api/data/blogs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Best Android Phones 2026",
    "category_id": "66a98767"
  }'
```

## 📚 Database Schema Summary

```
COLLECTIONS
├── categories
│   ├── id (Primary Key)
│   ├── name
│   ├── parent_id (FOREIGN KEY - self-reference)
│   ├── slug
│   └── timestamps
│
└── blogs
    ├── id (Primary Key)
    ├── title
    ├── category_id (FOREIGN KEY → categories.id)
    └── timestamps
```

## 🎯 Key Concepts

| Concept | What It Does |
|---------|-------------|
| **parent_id** | References the parent category (null for top-level) |
| **Relation type** | Field type that links records between collections |
| **Self-reference** | A collection referencing itself (categories → categories) |
| **Foreign key** | ID that points to a record in another collection |
| **Hierarchy tree** | Recursive structure showing all ancestors and descendants |
| **Breadcrumb** | Path from root to current location |

## ✅ Validation & Safety

The system automatically prevents:
- ✓ Creating records with invalid parent references
- ✓ Orphaned records (you can check parent exists before save)
- ✓ Circular references (parent A → parent B → parent A)

## 🚀 Next Steps

1. ✅ Implement the above steps
2. ⬜ Test querying by parent_id
3. ⬜ Build UI for category management
4. ⬜ Add breadcrumb navigation
5. ⬜ Create hierarchical selector dropdown
6. ⬜ Link blogs to categories
7. ⬜ Filter blogs by category

## 📞 Need Help?

- Check `RELATIONSHIP_SCHEMAS_GUIDE.md` for detailed explanations
- See `lib/relationship-helpers.ts` for utility functions
- Review the API routes for examples
