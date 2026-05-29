import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { MongoClient, ObjectId } from 'mongodb';
import type { ApiResponse } from '@/lib/types';
import { deleteCollection } from '@/lib/db';

// DB Configuration from environment variables
const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

let client: MongoClient | null = null;

async function getDb() {
  if (!client) {
    client = await MongoClient.connect(uri);
  }
  return client.db(dbName);
}

// GET method to fetch a single collection's metadata by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();

    // Search by ID if it's a valid ObjectId, otherwise fallback to searching by collection name
    const query = ObjectId.isValid(id) 
      ? { _id: new ObjectId(id) } 
      : { name: id };

    const collection = await db.collection('collections').findOne(query);

    if (!collection) {
      return NextResponse.json({ success: false, error: 'Collection not found' } as ApiResponse<null>, { status: 404 });
    }

    // Map _id to id and ensure folder_id is a string for frontend consistency
    const data = {
      ...collection,
      id: collection._id.toString(),
      _id: undefined,
      folder_id: collection.folder_id ? collection.folder_id.toString() : null,
    };
    return NextResponse.json({ success: true, data } as ApiResponse<typeof data>);
  } catch (error) {
    console.error('GET collection by ID error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' } as ApiResponse<null>, { status: 500 });
  }
}

// PATCH method to update a collection's metadata (e.g., folder_id)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['superadmin']); // Only superadmins can reorder collections
    const { id } = await params;

    const query = ObjectId.isValid(id) 
      ? { _id: new ObjectId(id) } 
      : { name: id };

    const body = await request.json();
    const { folder_id, name, display_name, description, icon, color } = body;

    const updateDoc: any = {};

    if (name !== undefined) updateDoc.name = name;
    if (display_name !== undefined) updateDoc.display_name = display_name;
    if (description !== undefined) updateDoc.description = description;
    if (icon !== undefined) updateDoc.icon = icon;
    if (color !== undefined) updateDoc.color = color;

    if (folder_id !== undefined) {
      if (folder_id === null) {
        updateDoc.folder_id = null; // Set to null for uncategorized
      } else if (typeof folder_id === 'string') {
        if (folder_id === '') {
          updateDoc.folder_id = null; // Also treat empty string as uncategorized
        } else {
          try {
            updateDoc.folder_id = new ObjectId(folder_id); // Convert to ObjectId
          } catch (e) {
            return NextResponse.json({ success: false, error: 'Invalid folder_id format' } as ApiResponse<null>, { status: 400 });
          }
        }
      } else {
        return NextResponse.json({ success: false, error: 'Invalid folder_id format' } as ApiResponse<null>, { status: 400 });
      }
    }

    if (Object.keys(updateDoc).length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' } as ApiResponse<null>, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection('collections').updateOne(
      query,
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Collection not found' } as ApiResponse<null>, { status: 404 });
    }

    const updatedCollection = await db.collection('collections').findOne(query);
    const data = updatedCollection ? { ...updatedCollection, id: updatedCollection._id.toString(), _id: undefined, folder_id: updatedCollection.folder_id ? updatedCollection.folder_id.toString() : null } : null;

    return NextResponse.json({ success: true, data } as ApiResponse<typeof data>);
  } catch (error) {
    console.error('PATCH collection by ID error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' } as ApiResponse<null>, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Call the database utility you already have in lib/db.ts
    const result = await deleteCollection(id);

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Collection deleted' }, { status: 200 });
  } catch (err) {
    console.error('Delete collection error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
