'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ChevronRight, Trash2, Edit2, Loader2 } from 'lucide-react';
import type { Collection } from '@/lib/types';

interface CollectionsListProps {
  collections?: Collection[];
  isLoading?: boolean;
  onDelete?: () => void;
  onUpdate?: () => void;
}

export function CollectionsList({ collections: initialCollections = [], isLoading: initialLoading = false, onDelete, onUpdate }: CollectionsListProps) {
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!initialCollections.length && !initialLoading) {
      fetchCollections();
    }
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
      const response = await fetch(`/api/collections/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete collection');
      }

      setCollections(collections.filter((c) => c.id !== id));
      toast({
        title: 'Success',
        description: 'Collection deleted successfully',
      });

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm text-primary/70 font-medium">Loading collections…</span>
        </div>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No collections yet. Create your first collection to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {collections.map((collection) => (
        <Card key={collection.id} className="flex flex-col shadow-sm border-border/60 bg-card hover:shadow-md transition-all">
          <CardHeader className="pb-3 border-b border-border/30 bg-muted/10">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {collection.icon && (
                    <span className="text-2xl">{collection.icon}</span>
                  )}
                  <CardTitle className="truncate">
                    {collection.display_name}
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  {collection.name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            {collection.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {collection.description}
              </p>
            )}
            <div className="flex flex-wrap gap-1 mb-4">
              {collection.fieldCount !== undefined && (
                <span className="inline-flex items-center rounded-full bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
                  {collection.fieldCount} fields
                </span>
              )}
              {collection.color && (
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: collection.color }}
                  title={`Color: ${collection.color}`}
                />
              )}
            </div>
          </CardContent>
          <div className="border-t p-3 flex gap-2">
            <Link href={`/collections/${collection.id}?collectionName=${collection.name}`} className="flex-1">
              <Button variant="default" size="sm" className="w-full justify-between">
                Open
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-primary/10 hover:text-primary"
              onClick={() => {
                setEditingCollection(collection);
                setEditDialogOpen(true);
              }}
              title="Edit collection"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-destructive/10 hover:text-destructive"
                  disabled={deletingId === collection.id}
                >
                  {deletingId === collection.id ? (
                    <span className="w-4 h-4 rounded-full border-2 border-destructive/30 border-t-destructive animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{collection.display_name}"? This action cannot be undone and will delete all associated fields.
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
        </Card>
      ))}
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
