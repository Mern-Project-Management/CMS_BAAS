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
    const folders = await db.collection('sidebar_folders').find().sort({ created_at: 1 }).toArray();
    
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
    const result = await db.collection('sidebar_folders').insertOne({
      name: body.name,
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

    return NextResponse.json({ success: true, data: null } as ApiResponse<null>);
  } catch (error) {
    console.error('Sidebar folders DELETE error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' } as ApiResponse<null>, { status: 500 });
  }
}