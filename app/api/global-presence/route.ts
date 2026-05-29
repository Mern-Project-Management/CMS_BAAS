import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireRole } from '@/lib/auth';

// ── GET  /api/global-presence  ─────────────────────────────────────────────
// Public — returns all active location entries
export async function GET() {
  try {
    const db = await getDb();
    const docs = await db
      .collection('global_presence')
      .find({})
      .sort({ created_at: -1 })
      .toArray();

    const data = docs.map((d) => {
      const { _id, ...rest } = d;
      return { id: _id.toString(), ...rest };
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    console.error('global-presence GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST  /api/global-presence  ────────────────────────────────────────────
// Admin only — create a new location entry
export async function POST(request: NextRequest) {
  try {
    await requireRole(['superadmin', 'admin']);

    const body = await request.json();
    const { label, address, phone, email, position } = body;

    if (!label || !address) {
      return NextResponse.json(
        { success: false, error: 'label and address are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const doc = {
      label,
      address,
      phone: phone ?? { href: '', label: '' },
      email: email ?? { href: '', label: '' },
      // position: { top: '30%', left: '20%' } — percentage strings for SVG map overlay
      position: position ?? { top: '50%', left: '50%' },
      created_at: now,
      updated_at: now,
    };

    const db = await getDb();
    const result = await db.collection('global_presence').insertOne(doc);

    return NextResponse.json(
      { success: true, data: { id: result.insertedId.toString(), ...doc } },
      { status: 201 }
    );
  } catch (err: any) {
    if (err?.message === 'Unauthorized' || err?.message === 'Forbidden') {
      return NextResponse.json({ success: false, error: err.message }, { status: 401 });
    }
    console.error('global-presence POST error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
