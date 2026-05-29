import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyUser } from '@/lib/db';
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
        { success: false, error: error instanceof Error ? error.message : 'Invalid credentials' } as ApiResponse<null>,
        { status: 401 }
      );
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

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
      } as ApiResponse<any>,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}