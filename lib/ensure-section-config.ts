import { createCollection, getCollectionByName } from '@/lib/db';

/**
 * Ensures the section configuration collection is initialized.
 * This collection stores settings that apply to specific sections of the website.
 */
export async function ensureSectionConfigCollection() {
  const name = 'section_configs';
  
  // Check if the collection already exists
  const existing = await getCollectionByName(name);
  if (existing.data) {
    return { sectionConfigCollectionId: existing.data.id };
  }

  // Create the collection if it doesn't exist
  const { data, error } = await createCollection({
    name,
    display_name: 'Section Configs',
    description: 'Stores settings and configurations for UI sections',
    icon: 'settings',
    color: '#6366F1',
  });

  if (error || !data) {
    throw new Error(`Failed to create collection ${name}: ${error || 'Unknown error'}`);
  }

  return { sectionConfigCollectionId: data.id };
}