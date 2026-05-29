import type { FieldType } from './types';

export const SITE_THEME_COLLECTION = 'site_theme';
export const SECTION_STYLES_COLLECTION = 'section_styles';
export const SECTION_CONFIG_COLLECTION = 'section_config';

export const SITE_THEME_COLOR_FIELDS = [
  { name: 'primary_color', display_name: 'Primary Brand', default: '#1e8a8a' },
  { name: 'theme_bg', display_name: 'Theme Background', default: '#d8e5e5' },
  { name: 'heading_color', display_name: 'Heading Color', default: '#0c1e21' },
  { name: 'body_text_color', display_name: 'Body Text', default: '#364e52' },
  { name: 'dark_color', display_name: 'Dark Accent', default: '#0c1e21' },
] as const;

export const SECTION_STYLE_COLOR_FIELDS = [
  { name: 'background_color', display_name: 'Background' },
  { name: 'text_color', display_name: 'Text' },
  { name: 'heading_color', display_name: 'Headings' },
  { name: 'primary_color', display_name: 'Accent / Buttons' },
  { name: 'hover_background_color', display_name: 'Hover background (cards)' },
  { name: 'hover_text_color', display_name: 'Hover text & icons' },
] as const;

export const SITE_THEME_FIELDS: Array<{
  name: string;
  display_name: string;
  field_type: FieldType;
  is_required?: boolean;
  is_unique?: boolean;
  description?: string;
}> = [
  { name: 'key', display_name: 'Theme Key', field_type: 'Text', is_required: true, is_unique: true },
  ...SITE_THEME_COLOR_FIELDS.map((f) => ({
    name: f.name,
    display_name: f.display_name,
    field_type: 'Color' as FieldType,
  })),
];

export const SECTION_STYLES_FIELDS: Array<{
  name: string;
  display_name: string;
  field_type: FieldType;
  is_required?: boolean;
  description?: string;
}> = [
  {
    name: 'section_id',
    display_name: 'Section ID',
    field_type: 'Text',
    is_required: true,
    description: 'Frontend sectionId (e.g. hero, features, cta)',
  },
  {
    name: 'page_slug',
    display_name: 'Page Slug',
    field_type: 'Text',
    description: 'e.g. home, about-us — leave empty for all pages',
  },
  ...SECTION_STYLE_COLOR_FIELDS.map((f) => ({
    name: f.name,
    display_name: f.display_name,
    field_type: 'Color' as FieldType,
  })),
  { name: 'is_active', display_name: 'Active', field_type: 'Boolean' },
];

export const SECTION_STYLES_EXTRA_FIELDS: Array<{
  name: string;
  display_name: string;
  field_type: FieldType;
  description?: string;
}> = [
  {
    name: 'styles_json',
    display_name: 'Extra styles (JSON)',
    field_type: 'JSON',
    description: 'Optional: { "card_border_color": "#eee" } — any *_color keys',
  },
];

export const SECTION_CONFIG_FIELDS: Array<{
  name: string;
  display_name: string;
  field_type: FieldType;
  is_required?: boolean;
  description?: string;
}> = [
  {
    name: 'section_id',
    display_name: 'Section ID',
    field_type: 'Text',
    is_required: true,
    description: 'Must match SectionTheme sectionId on the website',
  },
  {
    name: 'page_slug',
    display_name: 'Page Slug',
    field_type: 'Text',
    description: 'e.g. home, about-us',
  },
  {
    name: 'styles',
    display_name: 'Styles (JSON)',
    field_type: 'JSON',
    description: 'Colors: background_color, hover_background_color, card_border_color, etc.',
  },
  {
    name: 'content',
    display_name: 'Content (JSON)',
    field_type: 'JSON',
    description: 'Section copy: titles, items array, etc.',
  },
  { name: 'is_active', display_name: 'Active', field_type: 'Boolean' },
];

export const DEFAULT_FEATURES_CONTENT = {
  sub_title: 'Choose the Best',
  title: 'Empowering Business with Expertise.',
  title_highlight: 'Expertise.',
  button_text: 'Request a Call',
  button_url: '/contact',
  items: [
    {
      title: 'Innovative Solutions',
      desc: 'We stay ahead of the curve, leveraging cutting-edge technologies and strategies to keep you competitive in a marketplace.',
      icon: 'tji-innovative',
    },
    {
      title: 'Award-Winning Expertise',
      desc: 'Recognized by industry leaders, our award-winning team has a proven record of delivering excellence across projects.',
      icon: 'tji-award',
    },
    {
      title: 'Dedicated Support',
      desc: 'Our team is always available to address your concerns, providing quick and effective solution to keep your business.',
      icon: 'tji-support',
    },
  ],
};

export const DEFAULT_SECTION_CONFIGS = [
  {
    section_id: 'features',
    page_slug: 'home',
    is_active: true,
    styles: {
      background_color: '#ffffff',
      text_color: '#364e52',
      heading_color: '#0c1e21',
      primary_color: '#1e8a8a',
      hover_background_color: '#1e8a8a',
      hover_text_color: '#ffffff',
      card_background_color: '#ffffff',
    },
    content: DEFAULT_FEATURES_CONTENT,
  },
  {
    section_id: 'features',
    page_slug: 'about-us',
    is_active: true,
    styles: {
      hover_background_color: '#ffffff',
      hover_text_color: '#0c1e21',
    },
    content: {
      ...DEFAULT_FEATURES_CONTENT,
      sub_title: 'Our Mission',
    },
  },
];

export const DEFAULT_HOME_SECTIONS = [
  { section_id: 'hero', background_color: '#0c1e21', text_color: '#ffffff', heading_color: '#ffffff' },
  {
    section_id: 'features',
    background_color: '#ffffff',
    text_color: '#364e52',
    heading_color: '#0c1e21',
    primary_color: '#1e8a8a',
    hover_background_color: '#1e8a8a',
    hover_text_color: '#ffffff',
  },
  { section_id: 'brands', background_color: '#ecf0f0', text_color: '#364e52', heading_color: '#0c1e21' },
  { section_id: 'about', background_color: '#ffffff', text_color: '#364e52', heading_color: '#0c1e21' },
  { section_id: 'services', background_color: '#d8e5e5', text_color: '#364e52', heading_color: '#0c1e21' },
  { section_id: 'portfolios', background_color: '#ffffff', text_color: '#364e52', heading_color: '#0c1e21' },
  { section_id: 'funfact', background_color: '#1e8a8a', text_color: '#ffffff', heading_color: '#ffffff', primary_color: '#ffffff' },
  { section_id: 'testimonials', background_color: '#ffffff', text_color: '#364e52', heading_color: '#0c1e21' },
  { section_id: 'faq', background_color: '#ecf0f0', text_color: '#364e52', heading_color: '#0c1e21' },
  { section_id: 'contact', background_color: '#ffffff', text_color: '#364e52', heading_color: '#0c1e21' },
  { section_id: 'blogs', background_color: '#ffffff', text_color: '#364e52', heading_color: '#0c1e21' },
  { section_id: 'cta', background_color: '#0c1e21', text_color: '#ffffff', heading_color: '#ffffff', primary_color: '#1e8a8a' },
];
