import { NextRequest, NextResponse } from 'next/server';
import { getDb, oid } from '@/lib/db';
import { requireRole } from '@/lib/auth';

// ── PUT  /api/global-presence/[id]  ───────────────────────────────────────
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['superadmin', 'admin']);

    const { id } = await params;
    const _id = oid(id);
    if (!_id) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    const body = await request.json();
    const { label, address, phone, email, position } = body;

    const setFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (label !== undefined) setFields.label = label;
    if (address !== undefined) setFields.address = address;
    if (phone !== undefined) setFields.phone = phone;
    if (email !== undefined) setFields.email = email;
    if (position !== undefined) setFields.position = position;

    const db = await getDb();
    const result = await db
      .collection('global_presence')
      .findOneAndUpdate({ _id }, { $set: setFields }, { returnDocument: 'after' });

    if (!result) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    const { _id: docId, ...rest } = result as any;
    return NextResponse.json(
      { success: true, data: { id: docId.toString(), ...rest } },
      { status: 200 }
    );
  } catch (err: any) {
    if (err?.message === 'Unauthorized' || err?.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: err.message }, { status: 401 });
    }
    console.error('global-presence PUT error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ── DELETE  /api/global-presence/[id]  ────────────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['superadmin', 'admin']);

    const { id } = await params;
    const _id = oid(id);
    if (!_id) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection('global_presence').deleteOne({ _id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Deleted' }, { status: 200 });
  } catch (err: any) {
    if (err?.message === 'Unauthorized' || err?.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: err.message }, { status: 401 });
    }
    console.error('global-presence DELETE error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
