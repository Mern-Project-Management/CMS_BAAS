# 🛒 Real-World Usage: E-Commerce Category System

Complete example showing how to use your product categories schema in a real application.

## Scenario: E-Commerce Website

You want to build an e-commerce site with:
- Category navigation (nested dropdown)
- Product listings filtered by category
- Breadcrumb navigation
- SEO-optimized URLs

---

## Step 1: Create the Schema

```bash
# Run the setup script
node scripts/setup-product-categories.js
```

Result: Collection ID (save this!)
```
COLLECTION_ID=66a4f2b1c3d5e6f7g8h9i0j1
```

---

## Step 2: Create Products Collection (Links to Categories)

### Create products collection:
```bash
curl -X POST https://branduntold.in/api/collections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "products",
    "display_name": "Products",
    "description": "Products linked to categories"
  }'
```

### Add product fields:
```bash
# Product name
curl -X POST https://branduntold.in/api/fields \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "collection_id": "PRODUCTS_COLLECTION_ID",
    "name": "name",
    "display_name": "Product Name",
    "field_type": "Text",
    "is_required": true
  }'

# Link to category (THE KEY FIELD!)
curl -X POST https://branduntold.in/api/fields \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "collection_id": "PRODUCTS_COLLECTION_ID",
    "name": "category_id",
    "display_name": "Category",
    "field_type": "Relation",
    "relation_to_collection": "CATEGORIES_COLLECTION_ID",
    "is_required": true
  }'

# Price
curl -X POST https://branduntold.in/api/fields \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "collection_id": "PRODUCTS_COLLECTION_ID",
    "name": "price",
    "display_name": "Price",
    "field_type": "Number",
    "is_required": true
  }'

# Image
curl -X POST https://branduntold.in/api/fields \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "collection_id": "PRODUCTS_COLLECTION_ID",
    "name": "image",
    "display_name": "Product Image",
    "field_type": "Image"
  }'

# Description
curl -X POST https://branduntold.in/api/fields \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "collection_id": "PRODUCTS_COLLECTION_ID",
    "name": "description",
    "display_name": "Description",
    "field_type": "Text"
  }'
```

---

## Step 3: Create Sample Products

```bash
# Create product in Android Phones category
curl -X POST https://branduntold.in/api/data/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Samsung Galaxy S24",
    "category_id": "ANDROID_PHONES_ID",
    "price": 999.99,
    "image": "https://example.com/galaxy-s24.jpg",
    "description": "Latest Samsung flagship phone"
  }'

# Create product in iPhone category
curl -X POST https://branduntold.in/api/data/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "iPhone 16 Pro",
    "category_id": "IPHONE_ID",
    "price": 1299.99,
    "image": "https://example.com/iphone16.jpg",
    "description": "Latest Apple iPhone"
  }'
```

---

## Step 4: Frontend Implementation

### Component 1: Category Selector

```tsx
// components/category-selector.tsx
'use client';

import { HierarchicalSelector } from '@/components/hierarchical-selector';

interface Props {
  collectionId: string;
  onSelect: (categoryId: string) => void;
}

export function CategorySelector({ collectionId, onSelect }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Categories</h2>
      <HierarchicalSelector
        collectionId={collectionId}
        label="Select Category"
        placeholder="All Categories"
        onSelect={onSelect}
        includeRootLevel={true}
      />
    </div>
  );
}
```

### Component 2: Category Breadcrumb

```tsx
// components/category-breadcrumb.tsx
'use client';

import { HierarchicalBreadcrumb } from '@/components/hierarchical-breadcrumb';
import { useRouter } from 'next/navigation';

interface Props {
  collectionId: string;
  categoryId: string;
}

export function CategoryBreadcrumb({ collectionId, categoryId }: Props) {
  const router = useRouter();

  return (
    <HierarchicalBreadcrumb
      collectionId={collectionId}
      recordId={categoryId}
      onNavigate={(id) => {
        router.push(`/shop/category/${id}`);
      }}
    />
  );
}
```

### Component 3: Product Listing by Category

```tsx
// components/products-by-category.tsx
'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/lib/types';

interface Props {
  categoryId?: string;
}

export function ProductsByCategory({ categoryId }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [categoryId]);

  async function fetchProducts() {
    try {
      setLoading(true);

      // Build query
      let url = '/api/data/products';
      if (categoryId) {
        url += `?category_id=${categoryId}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (json.success) {
        setProducts(json.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading products...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <div key={product.id} className="border rounded-lg p-4 hover:shadow-lg">
          {product.image && (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-48 object-cover rounded mb-2"
            />
          )}
          <h3 className="font-bold text-lg">{product.name}</h3>
          <p className="text-gray-600 text-sm mb-2">{product.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold">${product.price}</span>
            <button className="bg-blue-600 text-white px-4 py-2 rounded">
              Add to Cart
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Component 4: Category Navigation Sidebar

```tsx
// components/category-navigation.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface CategoryNode {
  id: string;
  category: string;
  slug: string;
  children: CategoryNode[];
}

interface Props {
  collectionId: string;
  activeId?: string;
}

export function CategoryNavigation({ collectionId, activeId }: Props) {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchTree();
  }, [collectionId]);

  async function fetchTree() {
    try {
      const res = await fetch(`/api/hierarchies/${collectionId}`);
      const json = await res.json();
      if (json.success) {
        setTree(json.data);
      }
    } catch (error) {
      console.error('Error fetching tree:', error);
    }
  }

  function renderCategory(cat: CategoryNode, depth = 0) {
    const isActive = cat.id === activeId;
    const indent = depth * 20;

    return (
      <div key={cat.id}>
        <button
          onClick={() => router.push(`/shop/category/${cat.id}`)}
          className={`w-full text-left px-4 py-2 transition ${
            isActive
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-100 text-gray-800'
          }`}
          style={{ marginLeft: `${indent}px` }}
        >
          {cat.category}
        </button>

        {cat.children && cat.children.length > 0 && (
          <div>
            {cat.children.map((child) => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-3 font-bold">Categories</div>
      <div>
        {tree.length === 0 ? (
          <div className="px-4 py-2 text-gray-500">No categories</div>
        ) : (
          tree.map((cat) => renderCategory(cat))
        )}
      </div>
    </div>
  );
}
```

### Main Page: Category Shop

```tsx
// app/shop/category/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { CategoryBreadcrumb } from '@/components/category-breadcrumb';
import { CategoryNavigation } from '@/components/category-navigation';
import { ProductsByCategory } from '@/components/products-by-category';

const CATEGORIES_COLLECTION_ID = 'YOUR_COLLECTION_ID';

export default function CategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <CategoryBreadcrumb
          collectionId={CATEGORIES_COLLECTION_ID}
          categoryId={categoryId}
        />
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Sidebar with categories */}
        <div className="col-span-1">
          <CategoryNavigation
            collectionId={CATEGORIES_COLLECTION_ID}
            activeId={categoryId}
          />
        </div>

        {/* Main content */}
        <div className="col-span-3">
          <ProductsByCategory categoryId={categoryId} />
        </div>
      </div>
    </div>
  );
}
```

---

## Step 5: API Queries You'll Use

### Get All Products in a Category
```
GET /api/data/products?category_id=CATEGORY_ID
```

### Get All Top-Level Categories
```
GET /api/data/product_categories?parent_id=null
```

### Get Subcategories of Smartphones
```
GET /api/data/product_categories?parent_id=SMARTPHONES_ID
```

### Get Full Category Tree
```
GET /api/hierarchies/CATEGORIES_COLLECTION_ID
```

### Get Breadcrumb for Android Phones
```
GET /api/breadcrumbs/CATEGORIES_COLLECTION_ID/ANDROID_PHONES_ID
```

---

## Step 6: Advanced Queries

### Get Products with Category Info (Populated)

Create a helper function in your backend:

```typescript
// lib/product-service.ts

export async function getProductsWithCategories(categoryId?: string) {
  const url = categoryId
    ? `/api/data/products?category_id=${categoryId}`
    : `/api/data/products`;

  const res = await fetch(url);
  const json = await res.json();

  if (!json.success) return [];

  // For each product, fetch its category
  const productsWithCategory = await Promise.all(
    json.data.map(async (product: any) => {
      const catRes = await fetch(
        `/api/data/product_categories/${product.category_id}`
      );
      const catJson = await catRes.json();

      return {
        ...product,
        category: catJson.success ? catJson.data : null,
      };
    })
  );

  return productsWithCategory;
}
```

### Get Category with All Products

```typescript
export async function getCategoryWithProducts(categoryId: string) {
  // Get category
  const catRes = await fetch(`/api/data/product_categories/${categoryId}`);
  const catJson = await catRes.json();
  const category = catJson.data;

  // Get products in this category
  const prodRes = await fetch(
    `/api/data/products?category_id=${categoryId}`
  );
  const prodJson = await prodRes.json();

  return {
    ...category,
    products: prodJson.data || [],
  };
}
```

---

## Step 7: Filtering & Searching

### Get Products by Category + Price Range

```typescript
// Query existing endpoint multiple times, then filter in app
const allProducts = await getProductsWithCategories(categoryId);
const filtered = allProducts.filter(
  (p) => p.price >= minPrice && p.price <= maxPrice
);
```

### Search Products by Name

```typescript
export async function searchProducts(query: string) {
  const res = await fetch('/api/data/products');
  const json = await res.json();

  const results = json.data.filter((p: any) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return results;
}
```

---

## Step 8: SEO Implementation

### Generate URLs from Breadcrumb

```typescript
export async function generateCategoryUrl(categoryId: string) {
  const res = await fetch(
    `/api/breadcrumbs/CATEGORIES_COLLECTION_ID/${categoryId}`
  );
  const json = await res.json();

  if (!json.success) return '/';

  // Build URL from breadcrumb path
  const slugs = json.data.map((cat: any) => cat.slug);
  return `/shop/categories/${slugs.join('/')}`;
}
```

### Generate Sitemap

```typescript
// pages/api/sitemap.ts
export default async function handler(req: any, res: any) {
  const categRes = await fetch('/api/data/product_categories');
  const categJson = await categRes.json();

  const categories = categJson.data || [];

  const sitemap = categories
    .map((cat: any) => ({
      url: `/shop/category/${cat.id}`,
      changefreq: cat.changeFreq || 'weekly',
      priority: cat.priority || 0.5,
      lastmod: cat.lastmod || new Date().toISOString(),
    }))
    .map(
      (item: any) => `
  <url>
    <loc>https://example.com${item.url}</loc>
    <lastmod>${item.lastmod}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`
    )
    .join('');

  res.setHeader('Content-Type', 'application/xml');
  res.write(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap}
</urlset>`
  );
  res.end();
}
```

---

## Complete User Journey

```
1. User lands on /shop
   ↓
2. See category sidebar (from /api/hierarchies)
   ↓
3. Click "Electronics" 
   ↓
4. Page shows breadcrumb: Electronics
5. Show products where category_id = Electronics
   ↓
6. Click "Smartphones"
   ↓
7. Page shows breadcrumb: Electronics > Smartphones
8. Show products where category_id = Smartphones
   ↓
9. Click "Android Phones"
   ↓
10. Page shows breadcrumb: Electronics > Smartphones > Android Phones
11. Show products where category_id = Android Phones
```

---

## Performance Optimization

### Add Indexes to MongoDB

```javascript
// In your MongoDB:
db.product_categories.createIndex({ parent_id: 1 })
db.products.createIndex({ category_id: 1 })
db.product_categories.createIndex({ slug: 1 }, { unique: true })
```

### Cache Hierarchy Tree

```typescript
// pages/api/hierarchies/[collectionId].ts
export async function GET(req: any, res: any) {
  // Check cache first
  const cached = await redis.get(`categories:tree:${collectionId}`);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  // Fetch from DB
  const tree = await getHierarchyTree(collectionId);

  // Cache for 1 hour
  await redis.setex(`categories:tree:${collectionId}`, 3600, JSON.stringify(tree));

  return res.json({ success: true, data: tree });
}
```

---

## Summary

You now have:
- ✅ Category hierarchy (unlimited levels)
- ✅ Products linked to categories
- ✅ Navigation sidebar
- ✅ Breadcrumb trail
- ✅ SEO-friendly URLs
- ✅ Easy filtering and searching
- ✅ Sitemap generation

**Ready to scale to millions of products and categories!** 🚀
