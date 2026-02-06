import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' } as ApiResponse<null>,
        { status: 401 }
      );
    }
    return NextResponse.json(
      { success: true, data: session } as ApiResponse<typeof session>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
