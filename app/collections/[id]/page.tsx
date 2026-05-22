'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreateFieldDialog } from '@/components/create-field-dialog';
import { EditFieldDialog } from '@/components/edit-field-dialog';
import { EditCollectionDialog } from '@/components/edit-collection-dialog';
import { FieldsList } from '@/components/fields-list';
import { SchemaPreview } from '@/components/schema-preview';
import { HierarchicalSelector } from '@/components/hierarchical-selector';
import { RecordForm } from '@/components/record-form';
import { RecordsTable } from '@/components/records-table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-client';
import { ChevronLeft, Edit2 } from 'lucide-react';
import type { Collection, Field } from '@/lib/types';

export default function CollectionDetailPage() {
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
  const [records, setRecords] = useState<Array<{ id: string; [key: string]: any }>>([]);
  const [recordRefresh, setRecordRefresh] = useState(0);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editCollectionDialogOpen, setEditCollectionDialogOpen] = useState(false);

  // Detect if this collection has a hierarchy (a Relation field pointing to self or named 'parent')
  const parentRelationField = fields.find(
    (field) =>
      field.field_type === 'Relation' &&
      /parent/i.test(`${field.name} ${field.display_name}`)
  );
  const parentFieldName = parentRelationField?.name;

  // Transform flat records into a flattened tree for "layer-wise" display
  const hierarchicalRecords = useMemo(() => {
    if (!parentFieldName || records.length === 0) return records;

    // Capture as const so TypeScript knows it's a string inside nested functions
    const parentField: string = parentFieldName;

    // Build a set of all IDs present in the current dataset
    const allIds = new Set(records.map(r => r.id));

    function getRawParentId(item: any): string | null {
      const pValue = item[parentField];
      if (!pValue) return null;
      const id = typeof pValue === 'object' && pValue !== null
        ? String(pValue.id || '')
        : String(pValue);
      return id || null;
    }

    function buildTree(items: any[], parentId: string | null = null): any[] {
      return items
        .filter(item => {
          const pid = getRawParentId(item);
          if (parentId === null) {
            // Root: no parent value, or parent ID not found in this dataset
            return !pid || !allIds.has(pid);
          }
          return pid === parentId;
        })
        .map(item => ({
          ...item,
          children: buildTree(items, item.id),
        }));
    }

    function flatten(nodes: any[], depth = 0): any[] {
      let result: any[] = [];
      for (const node of nodes) {
        result.push({ ...node, _depth: depth });
        if (node.children?.length > 0) {
          result = result.concat(flatten(node.children, depth + 1));
        }
      }
      return result;
    }

    return flatten(buildTree(records));
  }, [records, parentFieldName]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchCollection();
      fetchFields();
    }
  }, [resolvedId, fieldRefresh, user, authLoading, router]);

  useEffect(() => {
    fetchRecords();
  }, [resolvedId, recordRefresh]);

  async function fetchCollection() {
    try {
      const response = await fetch(`/api/collections/${resolvedId}`);
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
      const res = await fetch(`/api/data/${resolvedId}`);
      const json = await res.json();
      console.log('Fetch records response:', json);
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <span className="text-sm text-primary/70 font-medium">Loading…</span>
        </div>
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
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                </div>
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
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <span className="text-sm text-primary/70 font-medium">Loading fields…</span>
            </div>
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

                  {parentFieldName ? (
                    <div className="space-y-10 pt-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-bold text-primary">Parent Table</h3>
                          <p className="text-sm text-muted-foreground">Main root-level items without parents.</p>
                        </div>
                        <RecordsTable
                          collectionId={collectionId}
                          fields={fields}
                          title="Root Records"
                          records={hierarchicalRecords.filter(r => r._depth === 0)}
                          hiddenFieldNames={[parentFieldName]}
                          onDelete={() => setRecordRefresh((p) => p + 1)}
                          onUpdate={() => setRecordRefresh((p) => p + 1)}
                        />
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-bold text-primary">Sub-Child Table</h3>
                          <p className="text-sm text-muted-foreground">Items directly under root categories.</p>
                        </div>
                        <RecordsTable
                          collectionId={collectionId}
                          fields={fields}
                          title="Child Records"
                          records={hierarchicalRecords.filter(r => r._depth === 1)}
                          onDelete={() => setRecordRefresh((p) => p + 1)}
                          onUpdate={() => setRecordRefresh((p) => p + 1)}
                        />
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-bold text-primary">Sub-Sub-Child Table</h3>
                          <p className="text-sm text-muted-foreground">Deeply nested items with full parent paths.</p>
                        </div>
                        <RecordsTable
                          collectionId={collectionId}
                          fields={fields}
                          title="Deeply Nested Records"
                          records={hierarchicalRecords.filter(r => r._depth > 1)}
                          onDelete={() => setRecordRefresh((p) => p + 1)}
                          onUpdate={() => setRecordRefresh((p) => p + 1)}
                        />
                      </div>
                    </div>
                  ) : (
                    <RecordsTable
                      collectionId={collectionId}
                      fields={fields}
                      records={records}
                      onDelete={() => setRecordRefresh((p) => p + 1)}
                      onUpdate={() => setRecordRefresh((p) => p + 1)}
                    />
                  )}
                </CardContent>
              </Card>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
