'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';
import { SiteThemeEditor } from '@/components/site-theme-editor';

export default function SiteThemePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Site theme</h1>
        <p className="text-muted-foreground mt-1">
          Global brand colors for your website — primary, backgrounds, headings, and body text.
        </p>
      </div>
      <SiteThemeEditor />
    </div>
  );
}
