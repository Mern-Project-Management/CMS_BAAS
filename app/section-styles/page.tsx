'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';
import { SectionStylesEditor } from '@/components/section-styles-editor';

export default function SectionStylesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Section styles</h1>
        <p className="text-muted-foreground mt-1">
          Background and text colors for each website section (hero, features, CTA, etc.).
        </p>
      </div>
      <SectionStylesEditor />
    </div>
  );
}
