import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { MongoClient, ObjectId } from 'mongodb';
import type { ApiResponse } from '@/lib/types';

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

export async function GET() {
  try {
    const db = await getDb();
    const folders = await db.collection('sidebar_folders').find().sort({ order: 1, created_at: 1 }).toArray();
    
    // Map _id to id for frontend compatibility
    const data = folders.map(f => ({ ...f, id: f._id.toString(), _id: undefined }));
    
    return NextResponse.json({ success: true, data } as ApiResponse<typeof data>);
  } catch (error) {
    console.error('Sidebar folders GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch folders' } as ApiResponse<null>, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['superadmin']);
    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json({ success: false, error: 'Folder name is required' } as ApiResponse<null>, { status: 400 });
    }

    const db = await getDb();
    
    // Get max order
    const lastFolder = await db.collection('sidebar_folders').find().sort({ order: -1 }).limit(1).toArray();
    const newOrder = lastFolder.length > 0 && typeof lastFolder[0].order === 'number' ? lastFolder[0].order + 1 : 0;

    const result = await db.collection('sidebar_folders').insertOne({
      name: body.name,
      order: newOrder,
      created_at: new Date()
    });

    const newFolder = await db.collection('sidebar_folders').findOne({ _id: result.insertedId });
    const data = newFolder ? { ...newFolder, id: newFolder._id.toString(), _id: undefined } : null;

    return NextResponse.json({ success: true, data } as ApiResponse<typeof data>);
  } catch (error) {
    console.error('Sidebar folders POST error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' } as ApiResponse<null>, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole(['superadmin']);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Folder ID is required' } as ApiResponse<null>, { status: 400 });
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid ID format' } as ApiResponse<null>, { status: 400 });
    }

    const db = await getDb();
    await db.collection('sidebar_folders').deleteOne({ _id: objectId });
    await db.collection('collections').updateMany(
      { folder_id: objectId },
      { $set: { folder_id: null } }
    );

    return NextResponse.json({ success: true, data: null } as ApiResponse<null>);
  } catch (error) {
    console.error('Sidebar folders DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' } as ApiResponse<null>, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole(['superadmin']);
    const body = await request.json();
    const { id, name } = body;

    if (!id || !name) {
      return NextResponse.json({ success: false, error: 'Folder ID and name are required' } as ApiResponse<null>, { status: 400 });
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid ID format' } as ApiResponse<null>, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection('sidebar_folders').updateOne(
      { _id: objectId },
      { $set: { name } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Folder not found' } as ApiResponse<null>, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id, name } } as ApiResponse<{ id: string, name: string }>);
  } catch (error) {
    console.error('Sidebar folders PATCH error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' } as ApiResponse<null>, { status: 500 });
  }
}