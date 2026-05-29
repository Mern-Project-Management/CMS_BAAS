import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { ensureThemeCollections } from '@/lib/ensure-theme-collections';
import type { ApiResponse } from '@/lib/types';

export async function POST() {
  try {
    await requireRole(['superadmin', 'admin']);
    const result = await ensureThemeCollections();
    return NextResponse.json({ success: true, data: result } as ApiResponse<typeof result>);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to initialize theme collections';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message } as ApiResponse<null>, { status });
  }
}
