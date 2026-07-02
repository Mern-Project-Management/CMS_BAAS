'use client';

import { CollectionsList } from '@/components/collections-list';
import { CreateCollectionDialog } from '@/components/create-collection-dialog';
import { FolderOpen } from 'lucide-react';

export default function CollectionsPage() {
  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FolderOpen className="w-5 h-5" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Collections</h2>
          </div>
          <p className="text-muted-foreground mt-1">
            Manage your database collections, create new schemas, and configure fields.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CreateCollectionDialog />
        </div>
      </div>

      <CollectionsList />
    </div>
  );
}
