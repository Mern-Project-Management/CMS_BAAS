'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FaqPageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function FaqPageSelector({ value, onChange, required }: FaqPageSelectorProps) {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOptions() {
      try {
        // Fetch categories
        const resCats = await fetch('/api/data/categories');
        const jsonCats = await resCats.json();
        const categories = jsonCats.success && Array.isArray(jsonCats.data) ? jsonCats.data : [];

        // Fetch products
        const resProds = await fetch('/api/data/our_products');
        const jsonProds = await resProds.json();
        const products = jsonProds.success && Array.isArray(jsonProds.data) ? jsonProds.data : [];

        // Fetch blogs
        const resBlogs = await fetch('/api/data/blog');
        const jsonBlogs = await resBlogs.json();
        const blogs = jsonBlogs.success && Array.isArray(jsonBlogs.data) ? jsonBlogs.data : [];

        const categoryMap = new Map<string, string>();
        categories.forEach((cat: any) => {
          const id = cat.id || cat._id;
          const slug = cat.category_slug || cat.slug;
          if (id && slug) {
            categoryMap.set(String(id), String(slug));
          }
        });

        // 1. Static options requested by the user:
        // home, about-us, categories, category-details, product-details, blog-details
        const list: { label: string; value: string }[] = [
          { label: 'Static: home', value: 'home' },
          { label: 'Static: about-us', value: 'about-us' },
          { label: 'Static: categories', value: 'categories' },
          { label: 'Static: category-details', value: 'category-details' },
          { label: 'Static: product-details', value: 'product-details' },
          { label: 'Static: blog-details', value: 'blog-details' },
        ];

        // 2. Categories
        categories.forEach((cat: any) => {
          const name = cat.category_name || cat.name || cat.title;
          const slug = cat.category_slug || cat.slug;
          if (slug) {
            list.push({
              label: `Category: ${name} (${slug})`,
              value: String(slug),
            });
          }
        });

        // 3. Products
        products.forEach((prod: any) => {
          const name = prod.name || prod.title;
          const slug = prod.slug;
          if (slug) {
            // Find category slug
            let catId = prod.category;
            if (catId && typeof catId === 'object') {
              catId = catId.id || catId._id;
            }
            const catSlug = catId ? categoryMap.get(String(catId)) : '';
            const productValue = catSlug ? `${catSlug}/${slug}` : slug;
            list.push({
              label: `Product: ${name} (${productValue})`,
              value: String(productValue),
            });
          }
        });

        // 4. Blogs
        blogs.forEach((blog: any) => {
          const title = blog.title;
          const slug = blog.slug;
          if (slug) {
            list.push({
              label: `Blog: ${title} (blogs/${slug})`,
              value: `blogs/${slug}`,
            });
          }
        });

        setOptions(list);
      } catch (err) {
        console.error('Failed to load FAQ page options', err);
      } finally {
        setLoading(false);
      }
    }

    loadOptions();
  }, []);

  return (
    <Select value={value || ''} onValueChange={onChange} required={required} disabled={loading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={loading ? 'Loading page options...' : 'Select a page'} />
      </SelectTrigger>
      <SelectContent className="max-h-72 overflow-y-auto font-sans">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
