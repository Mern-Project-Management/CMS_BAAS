'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditCollectionDialog } from '@/components/edit-collection-dialog';
import { HierarchicalSelector } from '@/components/hierarchical-selector';
import { RecordForm } from '@/components/record-form';
import { IconRenderer } from '@/components/icon-renderer';
import { RecordsTable } from '@/components/records-table';
import { PagesMetaTable } from '@/components/pages-meta-table';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-client';
import { ChevronLeft, Edit2, Calendar, Clock, Plus, Settings } from 'lucide-react';
import type { Collection, Field } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── Event status helpers ──────────────────────────────────────────────────────

type EventStatus = 'all' | 'upcoming' | 'past';

function resolveEventStatus(record: Record<string, any>): 'upcoming' | 'past' {
  if (record.status) {
    const s = String(record.status).toLowerCase().trim();
    if (s === 'past' || s === 'upcoming') return s;
  }
  if (record.date) {
    const eventDate = new Date(record.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today ? 'past' : 'upcoming';
  }
  return 'upcoming';
}

function EventStatusBadge({ record }: { record: Record<string, any> }) {
  const status = resolveEventStatus(record);
  return status === 'upcoming' ? (
    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 gap-1 text-xs">
      <Clock className="w-3 h-3" />
      Upcoming
    </Badge>
  ) : (
    <Badge variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-100 gap-1 text-xs">
      <Calendar className="w-3 h-3" />
      Past
    </Badge>
  );
}

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
  const [editCollectionDialogOpen, setEditCollectionDialogOpen] = useState(false);
  const [isRecordFormOpen, setIsRecordFormOpen] = useState(false);

  // Events status filter (only active when collection name is 'events')
  const isEventsCollection = resolvedId === 'events' || collection?.name === 'events';
  const [eventStatusFilter, setEventStatusFilter] = useState<EventStatus>('upcoming');

  // FAQ page filter (only active when collection name is 'faq')
  const isFaqCollection = resolvedId === 'faq' || collection?.name === 'faq';
  const [faqPageFilter, setFaqPageFilter] = useState<string>('all');

  const faqFilteredRecords = useMemo(() => {
    if (!isFaqCollection || faqPageFilter === 'all') return records;
    return records.filter((r) => r.page === faqPageFilter);
  }, [records, isFaqCollection, faqPageFilter]);

  const faqUniquePages = useMemo(() => {
    if (!isFaqCollection) return [];
    const pagesSet = new Set<string>();
    records.forEach((r) => {
      if (r.page) {
        pagesSet.add(String(r.page));
      }
    });
    return Array.from(pagesSet).sort();
  }, [records, isFaqCollection]);

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

  // For events collection: enrich records with resolved status and apply filter
  const enrichedRecords = useMemo(() => {
    if (!isEventsCollection) return records;
    return records.map((r) => ({ ...r, _resolvedStatus: resolveEventStatus(r) }));
  }, [records, isEventsCollection]);

  const eventFilteredRecords = useMemo(() => {
    if (!isEventsCollection || eventStatusFilter === 'all') return enrichedRecords;
    return enrichedRecords.filter((r) => r._resolvedStatus === eventStatusFilter);
  }, [enrichedRecords, isEventsCollection, eventStatusFilter]);

  const eventCounts = useMemo(() => {
    if (!isEventsCollection) return { all: 0, upcoming: 0, past: 0 };
    return {
      all: enrichedRecords.length,
      upcoming: enrichedRecords.filter((r) => r._resolvedStatus === 'upcoming').length,
      past: enrichedRecords.filter((r) => r._resolvedStatus === 'past').length,
    };
  }, [enrichedRecords, isEventsCollection]);

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
                  <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    {collection.icon && <IconRenderer icon={collection.icon} className="w-8 h-8 flex-shrink-0" />}
                    <span>{collection.display_name}</span>
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
            <div className="flex items-center gap-2">
              {isSuperadmin && collection && (
                <Link href={`/collections/${collectionId}/fields?collectionName=${collectionName}`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Manage Fields
                  </Button>
                </Link>
              )}
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
        </div>
        {collection && (
          <EditCollectionDialog
            collection={collection}
            open={editCollectionDialogOpen}
            onOpenChange={setEditCollectionDialogOpen}
            onSuccess={(updated) => {
              setCollection(updated);
              window.dispatchEvent(new Event('sidebar:refresh'));
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
            {/* Records Form & Table */}
            {collection && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Data</CardTitle>
                    <CardDescription>
                      View and manage records for this collection
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsRecordFormOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add New Record
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <Dialog open={isRecordFormOpen} onOpenChange={setIsRecordFormOpen}>
                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Record</DialogTitle>
                      </DialogHeader>
                      <RecordForm
                        collectionId={collectionId}
                        fields={fields}
                        onCreated={() => {
                          setRecordRefresh((p) => p + 1);
                          setIsRecordFormOpen(false);
                        }}
                      />
                    </DialogContent>
                  </Dialog>

                  {/* ── Events status filter tabs ── */}
                  {isEventsCollection && enrichedRecords.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mr-1">
                        Filter by Status:
                      </span>
                      {(['all', 'upcoming', 'past'] as EventStatus[]).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setEventStatusFilter(tab)}
                          className={`
                            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                            border transition-all duration-150 cursor-pointer
                            ${eventStatusFilter === tab
                              ? tab === 'upcoming'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : tab === 'past'
                                ? 'bg-gray-500 text-white border-gray-500'
                                : 'bg-primary text-primary-foreground border-primary'
                              : 'bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary'
                            }
                          `}
                        >
                          {tab === 'upcoming' && <Clock className="w-3 h-3" />}
                          {tab === 'past' && <Calendar className="w-3 h-3" />}
                          <span className="capitalize">{tab}</span>
                          <span className={`
                            inline-flex items-center justify-center min-w-[18px] h-[18px] px-1
                            rounded-full text-[10px] font-bold
                            ${eventStatusFilter === tab ? 'bg-white/25 text-inherit' : 'bg-muted text-muted-foreground'}
                          `}>
                            {eventCounts[tab]}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ── FAQ page filter dropdown ── */}
                  {isFaqCollection && records.length > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border/40 max-w-xs">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        Filter by Page:
                      </span>
                      <Select value={faqPageFilter} onValueChange={setFaqPageFilter}>
                        <SelectTrigger className="h-8 text-xs bg-white">
                          <SelectValue placeholder="All pages" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="all">All Pages</SelectItem>
                          {faqUniquePages.map((pageVal) => (
                            <SelectItem key={pageVal} value={pageVal}>
                              {pageVal}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

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
                          hiddenFields={collection.hidden_fields || []}
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
                          hiddenFields={collection.hidden_fields || []}
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
                          hiddenFields={collection.hidden_fields || []}
                          onDelete={() => setRecordRefresh((p) => p + 1)}
                          onUpdate={() => setRecordRefresh((p) => p + 1)}
                        />
                      </div>
                    </div>
                  ) : resolvedId === 'manage-meta' ? (
                    <PagesMetaTable
                      collectionId={collectionId}
                      fields={fields}
                      records={records}
                      onDelete={() => setRecordRefresh((p) => p + 1)}
                      onUpdate={() => setRecordRefresh((p) => p + 1)}
                      onAddNewClick={() => setIsRecordFormOpen(true)}
                    />
                  ) : (
                    <RecordsTable
                      collectionId={collectionId}
                      fields={fields}
                      records={
                        isEventsCollection
                          ? eventFilteredRecords
                          : isFaqCollection
                          ? faqFilteredRecords
                          : records
                      }
                      hiddenFields={collection.hidden_fields || []}
                      onDelete={() => setRecordRefresh((p) => p + 1)}
                      onUpdate={() => setRecordRefresh((p) => p + 1)}
                      statusRenderer={isEventsCollection
                        ? (record) => <EventStatusBadge record={record} />
                        : undefined
                      }
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
