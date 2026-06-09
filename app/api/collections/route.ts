import { NextRequest, NextResponse } from 'next/server';
import {
  getCollections,
  createCollection,
} from '@/lib/db';
import { requireRole } from '@/lib/auth';
import type { ApiResponse, CreateCollectionRequest } from '@/lib/types';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const { data, error } = await getCollections();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch collections' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    console.log('[collections] returning', data?.length || 0, 'collections');
    return NextResponse.json(
      { success: true, data } as ApiResponse<typeof data>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Collections GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['superadmin']);
    const body: CreateCollectionRequest & { folder_id?: string } = await request.json();

    // Validate required fields
    if (!body.name || !body.display_name) {
      return NextResponse.json(
        { success: false, error: 'Name and display_name are required' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Validate folder_id if provided to ensure it is a valid ObjectId
    if (body.folder_id && !ObjectId.isValid(body.folder_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid folder_id format' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const { data, error } = await createCollection({
      name: body.name.toLowerCase().replace(/\s+/g, '_'),
      display_name: body.display_name,
      description: body.description,
      icon: body.icon,
      color: body.color,
    } as any);

    if (error) {
      console.error('Create collection error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create collection' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data, message: 'Collection created successfully' } as ApiResponse<typeof data>,
      { status: 201 }
    );
  } catch (error) {
    console.error('Collections POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
