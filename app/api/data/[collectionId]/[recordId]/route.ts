import { NextRequest, NextResponse } from 'next/server';
import { deleteRecord, updateRecord, getCollection, getCollectionByName, getDb, oid } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';
import { ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';

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

function cleanLocalFile(filePathUrl: string) {
  if (typeof filePathUrl === 'string' && filePathUrl.startsWith('/uploads/')) {
    try {
      const fullPath = path.join(process.cwd(), 'public', filePathUrl);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (err) {
      console.error(`Failed to unlink file at ${filePathUrl}:`, err);
    }
  }
}

function findFilesInObject(obj: any): string[] {
  const fileUrls: string[] = [];
  if (!obj) return fileUrls;
  if (typeof obj === 'string') {
    if (obj.startsWith('/uploads/')) {
      fileUrls.push(obj);
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      fileUrls.push(...findFilesInObject(item));
    }
  } else if (typeof obj === 'object') {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fileUrls.push(...findFilesInObject(obj[key]));
      }
    }
  }
  return fileUrls;
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

    // Retrieve the old document before editing it
    const db = await getDb();
    const oldDoc = await db.collection(collectionName).findOne({ _id: oid(recordId) });

    const { data, error: updateError } = await updateRecord(collectionName, recordId, payload);
    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update record' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    // Clean up replaced or removed files
    if (oldDoc) {
      const oldFiles = findFilesInObject(oldDoc);
      const newFiles = findFilesInObject(payload);
      for (const oldFile of oldFiles) {
        if (!newFiles.includes(oldFile)) {
          cleanLocalFile(oldFile);
        }
      }
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

    // Retrieve the document before deleting it
    const db = await getDb();
    const oldDoc = await db.collection(collectionName).findOne({ _id: oid(recordId) });

    const { error: deleteError } = await deleteRecord(collectionName, recordId);
    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete record' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    // Clean up all local public files in the deleted record
    if (oldDoc) {
      const oldFiles = findFilesInObject(oldDoc);
      for (const oldFile of oldFiles) {
        cleanLocalFile(oldFile);
      }
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

