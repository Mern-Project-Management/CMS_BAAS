import { NextRequest, NextResponse } from 'next/server';
import { deleteRecord, updateRecord } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string; recordId: string }> }
) {
  try {
    await requireAuth();
    const { collectionId, recordId } = await params;
    const payload = await request.json();
    const { data, error } = await updateRecord(collectionId, recordId, payload);
    if (error) {
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
    const { error } = await deleteRecord(collectionId, recordId);
    if (error) {
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

