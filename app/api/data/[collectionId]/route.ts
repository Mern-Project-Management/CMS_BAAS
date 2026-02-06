import { NextRequest, NextResponse } from 'next/server';
import { createRecord, getCollectionFields, getRecords } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    await requireAuth();
    const { collectionId } = await params;
    const { data, error } = await getRecords(collectionId);
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch records' } as ApiResponse<null>,
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: true, data } as ApiResponse<typeof data>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Records GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    await requireAuth();
    const { collectionId } = await params;
    const payload = await request.json();

    // Basic required check against field definitions
    const { data: fields } = await getCollectionFields(collectionId);
    if (fields) {
      for (const f of fields) {
        if (!f.is_required) continue;
        const v = payload[f.name];
        if (f.field_type === 'Array') {
          const isArray = Array.isArray(v);
          if (!isArray || v.length === 0) {
            return NextResponse.json(
              { success: false, error: `${f.display_name} is required (add at least one item)` } as ApiResponse<null>,
              { status: 400 }
            );
          }
        } else if (v === undefined || v === null || v === '') {
          return NextResponse.json(
            { success: false, error: `${f.display_name} is required` } as ApiResponse<null>,
            { status: 400 }
          );
        }
      }
    }

    const { data, error } = await createRecord(collectionId, payload);
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to create record' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data, message: 'Record created successfully' } as ApiResponse<typeof data>,
      { status: 201 }
    );
  } catch (error) {
    console.error('Records POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

