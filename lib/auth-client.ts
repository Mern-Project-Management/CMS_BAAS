'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import type { SessionUser } from './types';

export function useAuth() {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      const json = await res.json();
      if (json.success && json.data) {
        setUser(json.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser, pathname]); // Refresh when pathname changes (e.g., after login redirect)

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/login';
  }

  return { user, loading, logout, isSuperadmin: user?.role === 'superadmin', isAdmin: user?.role === 'admin' };
}
