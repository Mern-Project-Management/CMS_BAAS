import { NextRequest, NextResponse } from 'next/server';
import {
  getCollection,
  updateCollection,
  deleteCollection,
} from '@/lib/db';
import { requireRole } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await getCollection(id);

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data } as ApiResponse<typeof data>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Collection GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['superadmin']);
    const { id } = await params;
    const body = await request.json();

    // Only pass allowed fields so we don't send undefined or extra props
    const updates: Record<string, string> = {};
    if (body.name != null && String(body.name).trim() !== '') updates.name = String(body.name).trim().toLowerCase().replace(/\s+/g, '_');
    if (body.display_name != null && String(body.display_name).trim() !== '') updates.display_name = String(body.display_name).trim();
    if (body.description != null) updates.description = String(body.description);
    if (body.icon != null) updates.icon = String(body.icon);
    if (body.color != null) updates.color = String(body.color);

    const { data, error } = await updateCollection(id, updates);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to update collection' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data, message: 'Collection updated successfully' } as ApiResponse<typeof data>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Collection PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['superadmin']);
    const { id } = await params;
    const { error } = await deleteCollection(id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete collection' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Collection deleted successfully' } as ApiResponse<null>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Collection DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
