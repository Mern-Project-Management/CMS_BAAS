import { NextRequest, NextResponse } from 'next/server';
import { getDb, oid } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// GET /api/users - Get all users with role names
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    
    const db = await getDb();
    const usersCol = db.collection('users');
    const rolesCol = db.collection('roles');

    const users = await usersCol.find({}).toArray();
    const roles = await rolesCol.find({}).toArray();

    const roleMap = new Map(roles.map((r: any) => [r._id.toString(), r.name]));

    const usersWithRoles = users.map((u: any) => ({
      id: u._id.toString(),
      username: u.username,
      email: u.email,
      role: u.role,
      role_id: u.role_id,
      role_name: u.role_id ? roleMap.get(u.role_id) : null,
      created_at: u.created_at,
    }));

    return NextResponse.json({ success: true, data: usersWithRoles });
  } catch (err) {
    console.error('users GET error:', err);
    if ((err as Error).message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/users - Create a new user (superadmin only)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    if (session.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { username, email, password, role, role_id } = body;

    if (!username?.trim()) {
      return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    if (!role) {
      return NextResponse.json({ success: false, error: 'Role is required' }, { status: 400 });
    }

    const db = await getDb();
    const usersCol = db.collection('users');

    // Check username uniqueness
    const existingUsername = await usersCol.findOne({ username: username.trim() });
    if (existingUsername) {
      return NextResponse.json({ success: false, error: 'Username already taken' }, { status: 409 });
    }

    // Check email uniqueness
    const existingEmail = await usersCol.findOne({ email: email.trim().toLowerCase() });
    if (existingEmail) {
      return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 409 });
    }

    // Validate role_id if provided
    if (role_id) {
      const rolesCol = db.collection('roles');
      const roleObjId = oid(role_id);
      if (!roleObjId) {
        return NextResponse.json({ success: false, error: 'Invalid role ID' }, { status: 400 });
      }
      const roleDoc = await rolesCol.findOne({ _id: roleObjId });
      if (!roleDoc) {
        return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
      }
    }

    const now = new Date().toISOString();
    const newUser: any = {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashPassword(password),
      role: role,
      role_id: role_id || null,
      created_at: now,
      updated_at: now,
    };

    const result = await usersCol.insertOne(newUser);

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        role_id: newUser.role_id,
        created_at: newUser.created_at,
      },
      message: 'User created successfully',
    });
  } catch (err) {
    console.error('users POST error:', err);
    if ((err as Error).message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/users - Update user role assignment and profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Only superadmin can assign roles
    if (session.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, role_id, username, email, password, role } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Prevent modifying superadmin
    const db = await getDb();
    const usersCol = db.collection('users');
    const userId = oid(id);
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
    }
    const userDoc = await usersCol.findOne({ _id: userId });

    if (!userDoc) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (userDoc.role === 'superadmin') {
      return NextResponse.json({ success: false, error: 'Cannot modify superadmin' }, { status: 403 });
    }

    // Validate role_id if provided
    if (role_id) {
      const rolesCol = db.collection('roles');
      const roleId = oid(role_id);
      if (!roleId) {
        return NextResponse.json({ success: false, error: 'Invalid role ID' }, { status: 400 });
      }
      const roleDoc = await rolesCol.findOne({ _id: roleId });
      if (!roleDoc) {
        return NextResponse.json({ success: false, error: 'Invalid role ID' }, { status: 400 });
      }
    }

    const updateDoc: any = {
      updated_at: new Date().toISOString(),
    };

    if (role_id !== undefined) {
      updateDoc.role_id = role_id || null;
    }

    if (role) {
      updateDoc.role = role;
    }

    if (username?.trim()) {
      // Check username uniqueness (excluding self)
      const existing = await usersCol.findOne({ username: username.trim(), _id: { $ne: userId } });
      if (existing) {
        return NextResponse.json({ success: false, error: 'Username already taken' }, { status: 409 });
      }
      updateDoc.username = username.trim();
    }

    if (email?.trim()) {
      // Check email uniqueness (excluding self)
      const existing = await usersCol.findOne({ email: email.trim().toLowerCase(), _id: { $ne: userId } });
      if (existing) {
        return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 409 });
      }
      updateDoc.email = email.trim().toLowerCase();
    }

    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
      }
      updateDoc.password = hashPassword(password);
    }

    await usersCol.updateOne({ _id: oid(id) }, { $set: updateDoc });

    return NextResponse.json({ success: true, message: 'User updated' });
  } catch (err) {
    console.error('users PATCH error:', err);
    if ((err as Error).message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/users?id=xxx - Delete a user (superadmin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth();

    if (session.role !== 'superadmin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const db = await getDb();
    const usersCol = db.collection('users');
    const userId = oid(id);

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Invalid user ID' }, { status: 400 });
    }

    const userDoc = await usersCol.findOne({ _id: userId });
    if (!userDoc) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting superadmin or self
    if (userDoc.role === 'superadmin') {
      return NextResponse.json({ success: false, error: 'Cannot delete superadmin' }, { status: 403 });
    }

    if (userDoc._id.toString() === session.id) {
      return NextResponse.json({ success: false, error: 'Cannot delete yourself' }, { status: 403 });
    }

    await usersCol.deleteOne({ _id: userId });

    return NextResponse.json({ success: true, message: 'User deleted' });
  } catch (err) {
    console.error('users DELETE error:', err);
    if ((err as Error).message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
