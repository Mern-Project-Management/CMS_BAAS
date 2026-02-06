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
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-full">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="space-y-8">
          {/* Actions Bar */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Collections</h2>
              <p className="text-sm text-muted-foreground">
                {isSuperadmin
                  ? 'Create and manage your data collections and fields without database migrations'
                  : 'View and manage data records'}
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
