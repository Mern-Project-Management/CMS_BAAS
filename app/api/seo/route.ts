import { NextRequest, NextResponse } from 'next/server';
import { getCollection, getRecords, getCollectionByName } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

// SEO fields to fetch
const SEO_FIELDS = [
  'meta_title',
  'meta_description',
  'meta_keywords',
  'canonical_url',
  'og_image',
  'og_title',
  'og_description',
  'no_index',
  'redirect_url'
];

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    
    const searchParams = request.nextUrl.searchParams;
    const collectionId = searchParams.get('collection_id');
    const recordId = searchParams.get('record_id');
    const slug = searchParams.get('slug');

    if (!collectionId) {
      return NextResponse.json(
        { success: false, error: 'collection_id is required' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Resolve collection by name or ID
    const collectionRes = await getCollection(collectionId);
    const collection = collectionRes.data 
      ? collectionRes 
      : await getCollectionByName(collectionId);

    if (!collection.data) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    // If recordId provided, fetch specific record
    if (recordId) {
      const { data: records, error } = await getRecords(collection.data.name, 1, { _id: recordId });
      
      if (error || !records || records.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Record not found' } as ApiResponse<null>,
          { status: 404 }
        );
      }

      const record = records[0];
      const seoData = extractSeoFields(record);
      
      return NextResponse.json(
        { success: true, data: seoData } as ApiResponse<typeof seoData>,
        { status: 200 }
      );
    }

    // If slug provided, fetch by slug
    if (slug) {
      const { data: records, error } = await getRecords(collection.data.name, 1, { slug });
      
      if (error || !records || records.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Record not found' } as ApiResponse<null>,
          { status: 404 }
        );
      }

      const record = records[0];
      const seoData = extractSeoFields(record);
      
      return NextResponse.json(
        { success: true, data: seoData } as ApiResponse<typeof seoData>,
        { status: 200 }
      );
    }

    // Fetch all SEO data for collection
    const { data: records, error } = await getRecords(collection.data.name, 100);
    
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch records' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    const seoData = (records || []).map((record: any) => ({
      id: record._id?.toString() || record.id,
      slug: record.slug,
      ...extractSeoFields(record)
    }));

    return NextResponse.json(
      { success: true, data: seoData } as ApiResponse<typeof seoData>,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('SEO GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

// Extract only SEO-related fields from a record
function extractSeoFields(record: any): Partial<{
  meta_title: string;
  meta_description: string;
  meta_keywords: string | string[];
  canonical_url: string;
  og_image: string;
  og_title: string;
  og_description: string;
  no_index: boolean;
  redirect_url: string;
}> {
  const seoData: any = {};
  
  SEO_FIELDS.forEach(field => {
    if (record[field] !== undefined && record[field] !== null) {
      seoData[field] = record[field];
    }
  });
  
  return seoData;
}
