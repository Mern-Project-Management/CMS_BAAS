import { NextRequest, NextResponse } from 'next/server';
import { deleteRecord, updateRecord, getCollection, getCollectionByName, getDb } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';
import { ObjectId } from 'mongodb';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Helper to delete an uploaded file by its URL path
async function deleteUploadedFile(fileUrl: string) {
  if (typeof fileUrl !== 'string' || !fileUrl.startsWith('/uploads/')) return;
  try {
    const filepath = path.join(process.cwd(), 'public', fileUrl);
    if (existsSync(filepath)) {
      await unlink(filepath);
      console.log(`Deleted unused upload file: ${filepath}`);
    }
  } catch (e) {
    console.error(`Failed to delete upload file: ${fileUrl}`, e);
  }
}

// Helper to extract upload URLs from a field value (handles strings and arrays of strings)
function extractUrls(val: any): string[] {
  if (typeof val === 'string' && val.startsWith('/uploads/')) {
    return [val];
  }
  if (Array.isArray(val)) {
    return val.filter(item => typeof item === 'string' && item.startsWith('/uploads/'));
  }
  return [];
}

async function resolveCollectionName(collectionId: string): Promise<{ collectionName: string; error?: string }> {
  let collectionName = collectionId;
  if (ObjectId.isValid(collectionId)) {
    const { data: collection } = await getCollection(collectionId);
    if (!collection) {
      return { collectionName: '', error: 'Collection not found' };
    }
    collectionName = collection.name;
  } else {
    const { data: collection } = await getCollectionByName(collectionId);
    if (!collection) {
      return { collectionName: '', error: 'Collection not found' };
    }
  }
  return { collectionName };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string; recordId: string }> }
) {
  try {
    await requireAuth();
    const { collectionId, recordId } = await params;
    const payload = await request.json();

    const { collectionName, error } = await resolveCollectionName(collectionId);
    if (error) {
      return NextResponse.json(
        { success: false, error } as ApiResponse<null>,
        { status: 404 }
      );
    }

    // 1. Fetch the existing record to find removed/replaced files
    const db = await getDb();
    let recordObjectId;
    try {
      recordObjectId = new ObjectId(recordId);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid record ID format' }, { status: 400 });
    }
    const existingRecord = await db.collection(collectionName).findOne({ _id: recordObjectId });

    // 2. Identify files that are no longer referenced in the payload
    if (existingRecord) {
      const existingUrls: string[] = [];
      const newUrls: string[] = [];

      for (const key in existingRecord) {
        existingUrls.push(...extractUrls(existingRecord[key]));
      }
      for (const key in payload) {
        newUrls.push(...extractUrls(payload[key]));
      }

      // Find URLs present in existing record but missing in the update payload
      const urlsToDelete = existingUrls.filter(url => !newUrls.includes(url));
      for (const url of urlsToDelete) {
        await deleteUploadedFile(url);
      }
    }

    // 3. Update the record
    const { data, error: updateError } = await updateRecord(collectionName, recordId, payload);
    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update record' } as ApiResponse<null>,
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: true, data, message: 'Record updated successfully' } as ApiResponse<typeof data>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Records PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ collectionId: string; recordId: string }> }
) {
  try {
    await requireAuth();
    const { collectionId, recordId } = await params;

    const { collectionName, error } = await resolveCollectionName(collectionId);
    if (error) {
      return NextResponse.json(
        { success: false, error } as ApiResponse<null>,
        { status: 404 }
      );
    }

    // 1. Fetch the existing record to find and delete all associated files
    const db = await getDb();
    let recordObjectId;
    try {
      recordObjectId = new ObjectId(recordId);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid record ID format' }, { status: 400 });
    }
    const existingRecord = await db.collection(collectionName).findOne({ _id: recordObjectId });

    if (existingRecord) {
      const existingUrls: string[] = [];
      for (const key in existingRecord) {
        existingUrls.push(...extractUrls(existingRecord[key]));
      }
      for (const url of existingUrls) {
        await deleteUploadedFile(url);
      }
    }

    // 2. Perform deletion
    const { error: deleteError } = await deleteRecord(collectionName, recordId);
    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete record' } as ApiResponse<null>,
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: true, message: 'Record deleted successfully' } as ApiResponse<null>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Records DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
