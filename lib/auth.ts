import { cookies } from 'next/headers';
import { getUserById } from './db';
import { getDb, oid } from './db';
import type { SessionUser, UserRole } from './types';

const SESSION_COOKIE = 'auth_session';

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  const { data: user } = await getUserById(sessionId);
  if (!user) return null;

  // Fetch permissions if user has a role_id
  let permissions: string[] = [];
  if (user.role_id) {
    try {
      const db = await getDb();
      const rolesCol = db.collection('roles');
      const objectId = oid(user.role_id);
      if (objectId) {
        const roleDoc = await rolesCol.findOne({ _id: objectId });
        if (roleDoc) {
          permissions = roleDoc.permissions || [];
        }
      }
    } catch (err) {
      console.error('Failed to fetch role permissions:', err);
    }
  } else if (user.role === 'superadmin' || user.role === 'viewer') {
    // Superadmin and viewer have all permissions
    const { SIDEBAR_PERMISSIONS } = await import('./types');
    permissions = [...SIDEBAR_PERMISSIONS];
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    role_id: user.role_id,
    permissions,
  };
}

export async function setSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<SessionUser> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new Error('Forbidden');
  }
  return session;
}

export async function requirePermission(permission: string): Promise<SessionUser> {
  const session = await requireAuth();
  // Superadmin has all permissions
  if (session.role === 'superadmin') {
    return session;
  }
  // Check if user has the specific permission
  if (!session.permissions || !session.permissions.includes(permission)) {
    throw new Error('Forbidden');
  }
  return session;
}
