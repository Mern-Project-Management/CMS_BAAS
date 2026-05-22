'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreateCollectionDialog } from '@/components/create-collection-dialog';
import { CollectionsList } from '@/components/collections-list';
import { useAuth } from '@/lib/auth-client';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, isSuperadmin } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <span className="text-sm text-primary/70 font-medium">Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-full">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="space-y-8">
          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground">Collections</h2>
              <p className="text-base text-muted-foreground mt-1 max-w-xl">
                {isSuperadmin
                  ? 'Create and manage your data collections and fields without database migrations. Organize your schema below.'
                  : 'View and manage data records across all accessible collections.'}
              </p>
            </div>
            {isSuperadmin && <CreateCollectionDialog />}
          </div>

          {/* Collections Grid */}
          <CollectionsList />
        </div>
      </div>
    </div>
  );
}
