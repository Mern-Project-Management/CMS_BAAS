import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { MongoClient, ObjectId } from 'mongodb';
import type { ApiResponse } from '@/lib/types';

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

let client: MongoClient | null = null;

async function getDb() {
  if (!client) {
    client = await MongoClient.connect(uri);
  }
  return client.db(dbName);
}

export async function PUT(request: NextRequest) {
  try {
    await requireRole(['superadmin']);
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json({ success: false, error: 'Items array is required' } as ApiResponse<null>, { status: 400 });
    }

    const db = await getDb();
    
    // Use bulkWrite to update orders efficiently
    const bulkOps = items.map((item: { id: string, order: number }) => ({
      updateOne: {
        filter: { _id: new ObjectId(item.id) },
        update: { $set: { order: item.order } }
      }
    }));

    if (bulkOps.length > 0) {
      await db.collection('collections').bulkWrite(bulkOps);
    }

    return NextResponse.json({ success: true, data: null } as ApiResponse<null>);
  } catch (error) {
    console.error('Collections reorder PUT error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' } as ApiResponse<null>, { status: 500 });
  }
}
