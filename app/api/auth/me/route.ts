import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDb, oid } from '@/lib/db';
import type { ApiResponse } from '@/lib/types';
import crypto from 'crypto';

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

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' } as ApiResponse<null>,
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, email, currentPassword, newPassword } = body;

    const db = await getDb();
    const usersCol = db.collection('users');

    const userOid = oid(session.id);
    if (!userOid) {
      return NextResponse.json(
        { success: false, error: 'Invalid user session' } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Fetch current user to verify current password if changing password
    const userDoc = await usersCol.findOne({ _id: userOid });
    if (!userDoc) {
      return NextResponse.json(
        { success: false, error: 'User not found' } as ApiResponse<null>,
        { status: 404 }
      );
    }

    // Build update object
    const updates: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };

    if (username?.trim()) {
      // Check username uniqueness (excluding self)
      const existing = await usersCol.findOne({
        username: username.trim(),
        _id: { $ne: userOid },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Username already taken' } as ApiResponse<null>,
          { status: 409 }
        );
      }
      updates.username = username.trim();
    }

    if (email?.trim()) {
      // Check email uniqueness (excluding self)
      const existing = await usersCol.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: userOid },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Email already in use' } as ApiResponse<null>,
          { status: 409 }
        );
      }
      updates.email = email.trim().toLowerCase();
    }

    if (newPassword) {
      // Require current password to change password
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: 'Current password is required to set a new password' } as ApiResponse<null>,
          { status: 400 }
        );
      }
      if (userDoc.password !== hashPassword(currentPassword)) {
        return NextResponse.json(
          { success: false, error: 'Current password is incorrect' } as ApiResponse<null>,
          { status: 400 }
        );
      }
      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 6 characters' } as ApiResponse<null>,
          { status: 400 }
        );
      }
      updates.password = hashPassword(newPassword);
    }

    await usersCol.updateOne({ _id: userOid }, { $set: updates });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: session.id,
          username: updates.username ?? session.username,
          email: updates.email ?? session.email,
          role: session.role,
        },
        message: 'Profile updated successfully',
      } as ApiResponse<any>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
