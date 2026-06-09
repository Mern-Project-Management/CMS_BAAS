import { NextRequest, NextResponse } from 'next/server';
import { deleteRecord, updateRecord } from '@/lib/db';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ── DELETE /api/career-application/[id] ───────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await deleteRecord('career_applications', params.id);
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete application' },
        { status: 500, headers: corsHeaders() }
      );
    }
    return NextResponse.json(
      { success: true, message: 'Application deleted' },
      { headers: corsHeaders() }
    );
  } catch (error: any) {
    console.error('Career Application DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete application' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// ── PATCH /api/career-application/[id] ────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { error } = await updateRecord('career_applications', params.id, body);
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to update application' },
        { status: 500, headers: corsHeaders() }
      );
    }
    return NextResponse.json(
      { success: true, message: 'Application updated' },
      { headers: corsHeaders() }
    );
  } catch (error: any) {
    console.error('Career Application PATCH Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update application' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({ success: true }, { headers: corsHeaders() });
}