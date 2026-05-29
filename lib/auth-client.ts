'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import type { SessionUser } from './types';

export function useAuth() {
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  // Track whether we've ever successfully authenticated in this session
  const hasAuthedRef = useRef(false);
  // Retry counter for transient failures
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  const fetchUser = useCallback(async () => {
    try {
      // Don't fetch if we're on the login page and never authenticated
      if (pathname === '/login' && !hasAuthedRef.current) {
        setLoading(false);
        return;
      }

      const res = await fetch('/api/auth/me');
      const json = await res.json();
      if (json.success && json.data) {
        setUser(json.data);
        hasAuthedRef.current = true;
        retryCountRef.current = 0; // Reset retries on success
      } else {
        // Only clear user if we get a definitive 401
        // Don't clear on other errors (500, network issues, etc.)
        if (res.status === 401) {
          setUser(null);
          hasAuthedRef.current = false;
        }
        // For non-401 errors, keep the existing user state
      }
    } catch {
      // Network error - don't immediately log out the user
      // Only clear after multiple consecutive failures
      retryCountRef.current += 1;
      if (retryCountRef.current >= MAX_RETRIES) {
        setUser(null);
        hasAuthedRef.current = false;
      }
      // Otherwise keep existing user state - they might just have a flaky connection
    } finally {
      setLoading(false);
    }
  }, [pathname]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]); // fetchUser already depends on pathname

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    hasAuthedRef.current = false;
    window.location.href = '/login';
  }

  return { user, loading, logout, isSuperadmin: user?.role === 'superadmin', isAdmin: user?.role === 'admin' };
}
