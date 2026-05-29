import {
  createCollection,
  createField,
  createRecord,
  getCollectionByName,
  getCollectionFields,
  getRecords,
} from '@/lib/db';
import { ensureSectionConfigCollection } from '@/lib/ensure-section-config';
import {
  DEFAULT_HOME_SECTIONS,
  SECTION_STYLES_COLLECTION,
  SECTION_STYLES_FIELDS,
  SECTION_STYLES_EXTRA_FIELDS,
  SITE_THEME_COLLECTION,
  SITE_THEME_COLOR_FIELDS,
  SITE_THEME_FIELDS,
} from '@/lib/theme-schema';

async function ensureCollection(
  name: string,
  display_name: string,
  description: string,
  icon: string,
  color: string,
) {
  const existing = await getCollectionByName(name);
  if (existing.data) return existing.data;

  const { data, error } = await createCollection({
    name,
    display_name,
    description,
    icon,
    color,
  });
  if (error || !data) throw new Error(`Failed to create collection ${name}`);
  return data;
}

async function ensureFields(collectionId: string, fields: typeof SITE_THEME_FIELDS) {
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    await createField({
      collection_id: collectionId,
      name: f.name,
      display_name: f.display_name,
      field_type: f.field_type,
      is_required: f.is_required ?? false,
      is_unique: (f as { is_unique?: boolean }).is_unique ?? false,
      description: f.description,
      field_order: i,
    });
  }
}

/** Add new schema fields (e.g. hover colors) to existing collections */
async function ensureMissingFields(
  collectionId: string,
  fields: typeof SECTION_STYLES_FIELDS,
  existingNames: Set<string>,
) {
  let order = existingNames.size;
  for (const f of fields) {
    if (existingNames.has(f.name)) continue;
    await createField({
      collection_id: collectionId,
      name: f.name,
      display_name: f.display_name,
      field_type: f.field_type,
      is_required: f.is_required ?? false,
      description: f.description,
      field_order: order++,
    });
    existingNames.add(f.name);
  }
}

export async function ensureThemeCollections() {
  const siteThemeCol = await ensureCollection(
    SITE_THEME_COLLECTION,
    'Site Theme',
    'Global brand colors for the marketing website',
    'palette',
    '#1e8a8a',
  );

  const sectionStylesCol = await ensureCollection(
    SECTION_STYLES_COLLECTION,
    'Section Styles',
    'Per-section background and text colors',
    'layout',
    '#3B82F6',
  );

  const { data: existingSiteFields } = await getCollectionFields(siteThemeCol.id);
  if (!existingSiteFields?.length) {
    await ensureFields(siteThemeCol.id, SITE_THEME_FIELDS);
  }

  const { data: existingSectionFields } = await getCollectionFields(sectionStylesCol.id);
  const sectionFieldNames = new Set((existingSectionFields || []).map((f) => f.name));
  if (!existingSectionFields?.length) {
    await ensureFields(sectionStylesCol.id, SECTION_STYLES_FIELDS);
  } else {
    await ensureMissingFields(sectionStylesCol.id, SECTION_STYLES_FIELDS, sectionFieldNames);
    await ensureMissingFields(
      sectionStylesCol.id,
      SECTION_STYLES_EXTRA_FIELDS as typeof SECTION_STYLES_FIELDS,
      sectionFieldNames,
    );
  }

  const { data: siteRecords } = await getRecords(SITE_THEME_COLLECTION, 10);
  if (!siteRecords?.length) {
    const defaults: Record<string, string> = { key: 'default' };
    for (const f of SITE_THEME_COLOR_FIELDS) {
      defaults[f.name] = f.default;
    }
    await createRecord(SITE_THEME_COLLECTION, defaults);
  }

  const { data: sectionRecords } = await getRecords(SECTION_STYLES_COLLECTION, 200);
  if (!sectionRecords?.length) {
    for (const row of DEFAULT_HOME_SECTIONS) {
      await createRecord(SECTION_STYLES_COLLECTION, {
        page_slug: 'home',
        is_active: true,
        ...row,
      });
    }
  }

  const sectionConfig = await ensureSectionConfigCollection();

  return {
    siteThemeCollectionId: siteThemeCol.id,
    sectionStylesCollectionId: sectionStylesCol.id,
    ...sectionConfig,
  };
}
