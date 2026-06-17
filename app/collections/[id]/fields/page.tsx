'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreateFieldDialog } from '@/components/create-field-dialog';
import { EditFieldDialog } from '@/components/edit-field-dialog';
import { FieldsList } from '@/components/fields-list';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-client';
import { ChevronLeft, Database } from 'lucide-react';
import type { Collection, Field } from '@/lib/types';
import { IconRenderer } from '@/components/icon-renderer';

export default function FieldsManagementPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading, isSuperadmin } = useAuth();
  
  const collectionId = params.id as string;
  const collectionName = searchParams.get('collectionName') || '';
  const resolvedId = collectionName || collectionId;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [fieldRefresh, setFieldRefresh] = useState(0);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isSuperadmin)) {
      router.push('/');
      return;
    }
    if (user && isSuperadmin) {
      fetchCollection();
      fetchFields();
    }
  }, [resolvedId, fieldRefresh, user, authLoading, isSuperadmin, router]);

  async function fetchCollection() {
    try {
      const response = await fetch(`/api/collections/${resolvedId}`);
      const result = await response.json();
      if (result.success) {
        setCollection(result.data);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchFields() {
    setLoading(true);
    try {
      const response = await fetch(`/api/fields?collection_id=${collectionId}`);
      const result = await response.json();

      if (result.success) {
        setFields(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to fetch fields');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load fields',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || (!collection && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <span className="text-sm text-primary/70 font-medium">Loading…</span>
        </div>
      </div>
    );
  }

  if (!isSuperadmin) return null;

  return (
    <div className="min-h-full">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Link href={`/collections/${collectionId}?collectionName=${collectionName}`}>
              <Button variant="outline" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to {collection?.display_name || 'Collection'}
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Database className="w-6 h-6 text-primary" />
                <span>Fields Management</span>
              </h1>
              {collection && (
                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                  Editing schema for <strong className="text-foreground">{collection.display_name}</strong>
                </p>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <span className="text-sm text-primary/70 font-medium">Loading fields…</span>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">Schema Fields</h2>
                  <p className="text-sm text-muted-foreground">
                    Define the structure of your {collection?.display_name} data
                  </p>
                </div>
                <CreateFieldDialog
                  collectionId={collectionId}
                  onSuccess={() => setFieldRefresh((prev) => prev + 1)}
                />
              </div>

              <Card>
                <CardContent className="pt-6">
                  <FieldsList
                    fields={fields}
                    onDelete={() => setFieldRefresh((prev) => prev + 1)}
                    onEdit={(field) => {
                      setEditingField(field);
                      setEditDialogOpen(true);
                    }}
                    onReorder={() => setFieldRefresh((prev) => prev + 1)}
                  />
                </CardContent>
              </Card>

              <EditFieldDialog
                field={editingField}
                open={editDialogOpen}
                onOpenChange={(open) => {
                  setEditDialogOpen(open);
                  if (!open) setEditingField(null);
                }}
                onSuccess={() => {
                  setFieldRefresh((prev) => prev + 1);
                  setEditDialogOpen(false);
                  setEditingField(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
