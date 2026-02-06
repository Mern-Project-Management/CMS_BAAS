import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/db';
import { setSession } from '@/lib/auth';
import type { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const { data: user, error } = await verifyUser(username, password);
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' } as ApiResponse<null>,
        { status: 401 }
      );
    }

    await setSession(user.id);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        message: 'Login successful',
      } as ApiResponse<typeof user>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
