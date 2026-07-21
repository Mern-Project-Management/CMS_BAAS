'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { EditCollectionDialog } from '@/components/edit-collection-dialog';
import { ChevronRight, ChevronLeft, Trash2, Pencil, Loader2, FolderOpen } from 'lucide-react';
import type { Collection } from '@/lib/types';
import { IconRenderer } from '@/components/icon-renderer';

interface CollectionsListProps {
  collections?: Collection[];
  isLoading?: boolean;
  onDelete?: () => void;
  onUpdate?: () => void;
  pageSize?: number;
}

export function CollectionsList({
  collections: initialCollections = [],
  isLoading: initialLoading = false,
  onDelete,
  onUpdate,
  pageSize = 9,
}: CollectionsListProps) {
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    if (!initialCollections.length && !initialLoading) {
      fetchCollections();
    }
    const handleRefresh = () => fetchCollections();
    window.addEventListener('sidebar:refresh', handleRefresh);
    return () => window.removeEventListener('sidebar:refresh', handleRefresh);
  }, []);

  async function fetchCollections() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/collections');
      const result = await response.json();
      if (result.success) {
        setCollections(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch collections');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load collections',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/collections/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete collection');

      const updated = collections.filter((c) => c.id !== id);
      setCollections(updated);

      const newTotalPages = Math.max(1, Math.ceil(updated.length / pageSize));
      if (currentPage > newTotalPages) setCurrentPage(newTotalPages);

      toast({ title: 'Success', description: 'Collection deleted successfully' });
      onDelete?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete collection',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(collections.length / pageSize));

  const paginatedCollections = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return collections.slice(start, start + pageSize);
  }, [collections, currentPage, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground font-medium tracking-wide">
            Loading collections…
          </span>
        </div>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <Card className="border-dashed border-2 bg-primary/[0.03]">
        <div className="py-14 text-center flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No collections yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Create your first collection to get started
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {paginatedCollections.map((collection) => (
          <Card
            key={collection.id}
            className="group relative  flex flex-col gap-3 p-3.5 border  bg-card hover:border-primary/30 hover:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08)] transition-all duration-200"
          >
            <div className="flex  items-start gap-2.5 min-w-0">
              <span className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ring-1 bg-primary/10 text-primary ring-primary/15">
                {collection.icon ? (
                  <IconRenderer icon={collection.icon} />
                ) : (
                  <FolderOpen className="w-4 h-4" />
                )}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-semibold text-foreground truncate leading-tight">
                  {collection.display_name}
                </p>
                <p className="text-[11px] text-muted-foreground/80 truncate leading-tight mt-0.5 font-mono">
                  {collection.name}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-border/40">
              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  onClick={() => {
                    setEditingCollection(collection);
                    setEditDialogOpen(true);
                  }}
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      disabled={deletingId === collection.id}
                      title="Delete"
                    >
                      {deletingId === collection.id ? (
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-destructive/30 border-t-destructive animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{collection.display_name}"? This
                        action cannot be undone and will delete all associated fields.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex justify-end gap-2">
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(collection.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <Link href={`/collections/${collection.id}?collectionName=${collection.name}`}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 text-xs font-medium gap-1 bg-primary/10 text-primary hover:bg-primary/20"
                >
                  Open
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Page <span className="font-medium text-foreground">{currentPage}</span> of{' '}
            {totalPages} <span className="mx-1 text-border">·</span> {collections.length} total
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === currentPage ? 'default' : 'outline'}
                    size="icon"
                    className="h-7 w-7 text-xs"
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </Button>
                )
              )}

            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      <EditCollectionDialog
        collection={editingCollection}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setEditingCollection(null);
        }}
        onSuccess={(updated) => {
          setCollections((prev) =>
            prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
          );
          setEditDialogOpen(false);
          setEditingCollection(null);
          onUpdate?.();
        }}
      />
    </div>
  );
}