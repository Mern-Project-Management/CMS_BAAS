import { NextRequest, NextResponse } from 'next/server';
import { updateField, deleteField } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['superadmin']);
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await updateField(id, body);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to update field' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data, message: 'Field updated successfully' } as ApiResponse<typeof data>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Field PATCH error:', error);
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
    const { error } = await deleteField(id);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete field' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Field deleted successfully' } as ApiResponse<null>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Field DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

