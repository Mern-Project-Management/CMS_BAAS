// SEO fields configuration for collections
export const SEO_FIELDS_CONFIG = [
  {
    name: 'meta_title',
    display_name: 'Meta Title',
    field_type: 'Text' as const,
    description: 'SEO title (50-60 characters recommended)',
    is_required: false,
    is_unique: false,
    is_encrypted: false,
    validation_rules: [],
    field_order: 999,
  },
  {
    name: 'meta_description',
    display_name: 'Meta Description',
    field_type: 'Textarea' as const,
    description: 'SEO description (150-160 characters recommended)',
    is_required: false,
    is_unique: false,
    is_encrypted: false,
    validation_rules: [],
    field_order: 998,
  },
  {
    name: 'meta_keywords',
    display_name: 'Meta Keywords',
    field_type: 'Text' as const,
    description: 'Comma-separated keywords (e.g., "seo, marketing, content")',
    is_required: false,
    is_unique: false,
    is_encrypted: false,
    validation_rules: [],
    field_order: 997,
  },
  {
    name: 'canonical_url',
    display_name: 'Canonical URL',
    field_type: 'Text' as const,
    description: 'Self-referencing URL (leave empty for auto-generate)',
    is_required: false,
    is_unique: false,
    is_encrypted: false,
    validation_rules: [],
    field_order: 996,
  },
  {
    name: 'og_image',
    display_name: 'Open Graph Image',
    field_type: 'Image' as const,
    description: 'Social media preview image (1200x630px recommended)',
    is_required: false,
    is_unique: false,
    is_encrypted: false,
    validation_rules: [],
    field_order: 995,
  },
  {
    name: 'og_title',
    display_name: 'OG Title',
    field_type: 'Text' as const,
    description: 'Override for social sharing (optional)',
    is_required: false,
    is_unique: false,
    is_encrypted: false,
    validation_rules: [],
    field_order: 994,
  },
  {
    name: 'og_description',
    display_name: 'OG Description',
    field_type: 'Textarea' as const,
    description: 'Override for social sharing (optional)',
    is_required: false,
    is_unique: false,
    is_encrypted: false,
    validation_rules: [],
    field_order: 993,
  },
  {
    name: 'no_index',
    display_name: 'No Index',
    field_type: 'Boolean' as const,
    description: 'Prevent search engines from indexing this page',
    is_required: false,
    is_unique: false,
    is_encrypted: false,
    validation_rules: [],
    default_value: 'false',
    field_order: 992,
  },
  {
    name: 'redirect_url',
    display_name: 'Redirect URL',
    field_type: 'Text' as const,
    description: '301 redirect target URL (optional)',
    is_required: false,
    is_unique: false,
    is_encrypted: false,
    validation_rules: [],
    field_order: 991,
  },
];

// Default SEO values for categories
export const DEFAULT_CATEGORY_SEO = {
  meta_title: (category: any) => 
    `${category.tagline || 'Category'} | ${category.heading || 'Brand Untold'}`,
  meta_description: (category: any) => 
    category.subheading || 'Explore our latest content and insights.',
  meta_keywords: (category: any) => 
    `${category.heading?.toLowerCase().replace(/\s+/g, ','), 'category'}`,
};

// Default SEO values for blog posts
export const DEFAULT_ARTICLE_SEO = {
  meta_title: (article: any) => 
    `${article.title || 'Article'} | Brand Untold`,
  meta_description: (article: any) => 
    article.description?.substring(0, 160) || 'Read our latest article.',
  meta_keywords: (article: any) => 
    article.tags?.join(',') || 'article, blog',
};
