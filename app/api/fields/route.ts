import { NextRequest, NextResponse } from 'next/server';
import {
  getCollectionFields,
  getCollectionByName,
  createField,
  reorderFields,
} from '@/lib/db';
import { requireRole } from '@/lib/auth';
import type { ApiResponse, CreateFieldRequest } from '@/lib/types';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const collectionId = request.nextUrl.searchParams.get('collection_id');
    console.log('[fields route] collectionId:', collectionId);

    if (!collectionId) {
      return NextResponse.json(
        { success: false, error: 'collection_id is required' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // If collectionId is not a valid ObjectId, try to resolve it by name
    let actualCollectionId = collectionId;
    if (!ObjectId.isValid(collectionId)) {
      const collectionResult = await getCollectionByName(collectionId);
      if (!collectionResult.data) {
        return NextResponse.json(
          { success: false, error: 'Collection not found' } as ApiResponse<null>,
          { status: 404 }
        );
      }
      actualCollectionId = collectionResult.data.id;
    }

    const { data, error } = await getCollectionFields(actualCollectionId);

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch fields' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data } as ApiResponse<typeof data>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Fields GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['superadmin']);
    const body: CreateFieldRequest = await request.json();

    // Validate required fields
    if (!body.collection_id || !body.name || !body.display_name || !body.field_type) {
      return NextResponse.json(
        { success: false, error: 'collection_id, name, display_name, and field_type are required' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const { data, error } = await createField({
      collection_id: body.collection_id,
      name: body.name.toLowerCase().replace(/\s+/g, '_'),
      display_name: body.display_name,
      field_type: body.field_type,
      description: body.description,
      is_required: body.is_required ?? false,
      is_unique: body.is_unique ?? false,
      is_encrypted: body.is_encrypted ?? false,
      validation_rules: body.validation_rules ?? {},
      default_value: body.default_value,
      field_order: body.field_order ?? 0,
      relation_to_collection: body.relation_to_collection,
    });

    if (error) {
      console.error('Create field error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create field' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data, message: 'Field created successfully' } as ApiResponse<typeof data>,
      { status: 201 }
    );
  } catch (error) {
    console.error('Fields POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireRole(['superadmin']);
    const body: Array<{ id: string; field_order: number }> = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: 'Request body must be an array' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    console.log('[reorder] received payload:', JSON.stringify(body));

    const { error } = await reorderFields(body);

    if (error) {
      console.error('[reorder] reorderFields error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to reorder fields' } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Fields reordered successfully' } as ApiResponse<null>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Fields PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
