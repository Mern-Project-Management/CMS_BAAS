import { NextRequest, NextResponse } from 'next/server';
import { getDb, oid } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const value = searchParams.get('value');
    const excludeId = searchParams.get('excludeId');

    if (value === null || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Value is required' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const db = await getDb();
    const fieldObjectId = oid(id);
    if (!fieldObjectId) {
      return NextResponse.json(
        { success: false, error: 'Invalid field ID' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Find the field to know its name and collection
    const field = await db.collection('fields').findOne({ _id: fieldObjectId });
    if (!field) {
      return NextResponse.json(
        { success: false, error: 'Field not found' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    const collection = await db.collection('collections').findOne({ _id: oid(field.collection_id) });
    if (!collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    // Query the collection to check if the value is unique
    const query: Record<string, any> = {
      [field.name]: value
    };

    if (excludeId) {
      const excludeOid = oid(excludeId);
      if (excludeOid) {
        query._id = { $ne: excludeOid };
      } else {
        query._id = { $ne: excludeId as any };
      }
    }

    const duplicate = await db.collection(collection.name).findOne(query);

    return NextResponse.json({
      success: true,
      unique: !duplicate,
    });
  } catch (error) {
    console.error('validate-unique GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
