'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateFieldDialog } from '@/components/create-field-dialog';
import { EditFieldDialog } from '@/components/edit-field-dialog';
import { EditCollectionDialog } from '@/components/edit-collection-dialog';
import { FieldsList } from '@/components/fields-list';
import { SchemaPreview } from '@/components/schema-preview';
import { RecordForm } from '@/components/record-form';
import { RecordsTable } from '@/components/records-table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-client';
import { ChevronLeft, Loader2, Edit2 } from 'lucide-react';
import type { Collection, Field } from '@/lib/types';

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading, isSuperadmin } = useAuth();
  const collectionId = params.id as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [fieldRefresh, setFieldRefresh] = useState(0);
  const [records, setRecords] = useState<Array<{ id: string; data: Record<string, unknown> }>>([]);
  const [recordRefresh, setRecordRefresh] = useState(0);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editCollectionDialogOpen, setEditCollectionDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchCollection();
      fetchFields();
    }
  }, [collectionId, fieldRefresh, user, authLoading, router]);

  useEffect(() => {
    fetchRecords();
  }, [collectionId, recordRefresh]);

  async function fetchCollection() {
    try {
      const response = await fetch(`/api/collections/${collectionId}`);
      const result = await response.json();

      if (result.success) {
        setCollection(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch collection');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load collection',
        variant: 'destructive',
      });
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

  async function fetchRecords() {
    try {
      const res = await fetch(`/api/data/${collectionId}`);
      const json = await res.json();
      if (json.success) {
        setRecords(json.data || []);
      } else {
        throw new Error(json.error || 'Failed to fetch records');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load records',
        variant: 'destructive',
      });
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  if (!collection && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Collection not found</h1>
          <Link href="/">
            <Button variant="outline">Back to Collections</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </Link>
              {collection ? (
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {collection.icon && <span className="mr-2">{collection.icon}</span>}
                    {collection.display_name}
                  </h1>
                  {collection.description && (
                    <p className="text-muted-foreground mt-1">
                      {collection.description}
                    </p>
                  )}
                </div>
              ) : (
                <Loader2 className="w-6 h-6 animate-spin" />
              )}
            </div>
            {isSuperadmin && collection && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditCollectionDialogOpen(true)}
                className="gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Collection
              </Button>
            )}
          </div>
        </div>
        {collection && (
          <EditCollectionDialog
            collection={collection}
            open={editCollectionDialogOpen}
            onOpenChange={setEditCollectionDialogOpen}
            onSuccess={(updated) => {
              setCollection(updated);
            }}
          />
        )}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Fields Section - Only for Superadmin */}
            {isSuperadmin && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-semibold">Fields</h2>
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

                {/* Schema Preview */}
                {collection && fields.length > 0 && (
                  <SchemaPreview collection={collection} fields={fields} />
                )}
              </>
            )}

            {/* Records Form & Table */}
            {collection && (
              <Card>
                <CardHeader>
                  <CardTitle>Data</CardTitle>
                  <CardDescription>
                    Create and view records for this collection
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RecordForm
                    collectionId={collectionId}
                    fields={fields}
                    onCreated={() => setRecordRefresh((p) => p + 1)}
                  />
                  <RecordsTable
                    collectionId={collectionId}
                    fields={fields}
                    records={records}
                    onDelete={() => setRecordRefresh((p) => p + 1)}
                  />
                </CardContent>
              </Card>
            )}

            {/* Collection Info */}
            <Card>
              <CardHeader>
                <CardTitle>Collection Information</CardTitle>
                <CardDescription>
                  Details about this collection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">
                      Collection Name
                    </p>
                    <p className="font-mono text-sm">{collection?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">
                      Display Name
                    </p>
                    <p className="font-mono text-sm">{collection?.display_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">
                      Total Fields
                    </p>
                    <p className="font-mono text-sm">{fields.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">
                      Created At
                    </p>
                    <p className="font-mono text-sm">
                      {collection?.created_at &&
                        new Date(collection.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
