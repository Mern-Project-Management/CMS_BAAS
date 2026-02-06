import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json(
      { success: true, message: 'Logged out successfully' } as ApiResponse<null>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
