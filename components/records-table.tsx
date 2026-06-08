'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FilePreview } from './file-preview';
import { MultiImageUpload } from './multi-image-upload';
import { FileUpload } from './file-upload';
import { HierarchicalSelector } from './hierarchical-selector';
import { TipTapEditor } from './tiptap-editor';
import { ColorField, ColorSwatch } from './color-field';
import { Eye, Pencil, Trash2, Columns3, X, Save } from 'lucide-react';
import type { Field } from '@/lib/types';

const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

type RecordRow = {
  id: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
};

type Props = {
  collectionId: string;
  fields: Field[];
  records: RecordRow[];
  title?: string;
  hiddenFieldNames?: string[];
  onDelete: () => void;
  onUpdate?: () => void;
};

export function RecordsTable({
  collectionId,
  fields,
  records,
  title = 'Records',
  hiddenFieldNames = [],
  onDelete,
  onUpdate,
}: Props) {
  const { toast } = useToast();

  // Column visibility
  const visibleFields = fields.filter((f) => !hiddenFieldNames.includes(f.name));
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set());

  const shownFields = visibleFields.filter((f) => !hiddenCols.has(f.id));

  // Modals
  const [viewRecord, setViewRecord] = useState<RecordRow | null>(null);
  const [editRecord, setEditRecord] = useState<RecordRow | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Handlers ──
  const openEdit = useCallback((record: RecordRow) => {
    const seed: Record<string, any> = {};
    fields.forEach((f) => {
      seed[f.name] = record[f.name] ?? (f.field_type === 'Boolean' ? false : '');
    });
    setEditData(seed);
    setEditRecord(record);
  }, [fields]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/data/${collectionId}/${id}`, { method: 'DELETE' });
      const json = await res.json();

      if (!res.ok || !json.success) throw new Error(json.error || 'Delete failed');

      toast({ title: 'Record deleted' });
      onDelete();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSave() {
    if (!editRecord) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/data/${collectionId}/${editRecord.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Update failed');

      toast({ title: 'Record updated' });
      setEditRecord(null);
      onUpdate?.();
      onDelete(); // refresh
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  const toggleCol = (fieldId: string) => {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      next.has(fieldId) ? next.delete(fieldId) : next.add(fieldId);
      return next;
    });
  };

  // ── Edit Field Renderer ──
  function renderEditField(field: Field) {
    const value = editData[field.name];
    const setValue = (v: any) => setEditData((prev) => {
      const next = { ...prev, [field.name]: v };

      // Auto-generate slug if it exists in fields and source is a "name" field
      if (['name', 'title', 'display_name', 'category'].includes(field.name) && fields.some(f => f.name === 'slug')) {
        next['slug'] = slugify(String(v));
      }

      // Auto-generate category_slug if category_name is changed
      if (field.name === 'category_name' && fields.some(f => f.name === 'category_slug')) {
        next['category_slug'] = slugify(String(v));
      }

      return next;
    });

    switch (field.field_type) {
      case 'Boolean':
        return (
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              checked={!!value}
              onCheckedChange={(checked) => setValue(!!checked)}
              id={`edit-${field.id}`}
            />
            <label htmlFor={`edit-${field.id}`} className="text-sm cursor-pointer">
              {field.display_name}
            </label>
          </div>
        );

      case 'Textarea':
        return (
          <Textarea
            value={value ?? ''}
            onChange={(e) => setValue(e.target.value)}
            placeholder={field.display_name}
          />
        );
      case 'JSON':
        return (
          <Textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => setValue(e.target.value)}
            rows={6}
            className="font-mono text-xs"
          />
        );
      case 'Color':
        return (
          <ColorField
            value={typeof value === 'string' ? value : ''}
            onChange={setValue}
          />
        );

      case 'Number':
        return (
          <Input
            type="number"
            value={value ?? ''}
            onChange={(e) => setValue(e.target.value === '' ? '' : Number(e.target.value))}
          />
        );

      case 'Date':
        return <Input type="date" value={value ?? ''} onChange={(e) => setValue(e.target.value)} />;
      case 'DateTime':
        return <Input type="datetime-local" value={value ?? ''} onChange={(e) => setValue(e.target.value)} />;

      case 'Editor':
        return (
          <TipTapEditor
            key={`editor-${field.id}-${editRecord?.id}`}
            content={typeof value === 'string' ? value : ''}
            onChange={setValue}
            placeholder={`Enter ${field.display_name.toLowerCase()}...`}
          />
        );

      case 'Array': {
        const items: string[] = Array.isArray(value) ? value : value ? [String(value)] : [];
        return (
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = e.target.value;
                    setValue(next);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setValue(items.filter((_, j) => j !== i))}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setValue([...items, ''])}>
              + Add item
            </Button>
          </div>
        );
      }

      case 'Image':
      case 'File':
        return <FileUpload field={field} value={value ?? ''} onChange={setValue} />;

      case 'ImageArray':
        return <MultiImageUpload value={Array.isArray(value) ? value : []} onChange={setValue} />;

      case 'Relation': {
        if (!field.relation_to_collection) {
          return (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              Relation target collection is not configured for this field.
            </div>
          );
        }
        const isSelfRelation = field.relation_to_collection === collectionId;
        return (
          <HierarchicalSelector
            collectionId={field.relation_to_collection}
            parentFieldName={isSelfRelation ? field.name : "parent_id"}
            value={value}
            onSelect={(selectedId) => setValue(selectedId)}
            placeholder={`Select ${field.display_name}...`}
          />
        );
      }

      default:
        return (
          <Input
            value={value ?? ''}
            onChange={(e) => setValue(e.target.value)}
            placeholder={field.display_name}
          />
        );
    }
  }

  return (
    <>
      <Card className="shadow-sm border-border/50 overflow-hidden">
        {/* ── Header ── */}
        <CardHeader className="bg-primary/5 border-b border-primary/10 pb-3 pt-4 px-4">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base font-semibold text-primary">{title || 'Records'}</CardTitle>
            <div className="flex items-center gap-2">
              {/* Column visibility toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                    <Columns3 className="w-3.5 h-3.5" />
                    Columns
                    {hiddenCols.size > 0 && (
                      <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                        {visibleFields.length - hiddenCols.size}/{visibleFields.length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Toggle columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {visibleFields.map((f) => (
                    <DropdownMenuCheckboxItem
                      key={f.id}
                      checked={!hiddenCols.has(f.id)}
                      onCheckedChange={() => toggleCol(f.id)}
                    >
                      {f.display_name}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {hiddenCols.size > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-7 text-xs"
                          onClick={() => setHiddenCols(new Set())}
                        >
                          Show all
                        </Button>
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        {/* ── Table ── */}
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {shownFields.map((f) => (
                  <TableHead key={f.id}>{f.display_name}</TableHead>
                ))}
                <TableHead className="w-32 text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={shownFields.length + 1} className="text-center text-muted-foreground py-10">
                    No records yet.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r) => (
                  <TableRow key={r.id} className="group">
                    {shownFields.map((f, idx) => (
                      <TableCell key={f.id} className="whitespace-nowrap max-w-[200px] truncate">
                        {idx === 0 && r._depth !== undefined && r._depth > 0 && (
                          <span className="text-primary/40 mr-1 font-mono select-none">
                            {'—'.repeat(r._depth)}{'›'}{' '}
                          </span>
                        )}
                        {formatValue(r, f)}
                      </TableCell>
                    ))}
                    <TableCell className="text-right pr-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* View */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                          title="View record"
                          onClick={() => setViewRecord(r)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {/* Edit */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                          title="Edit record"
                          onClick={() => openEdit(r)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                          title="Delete record"
                          onClick={() => handleDelete(r.id)}
                          disabled={deletingId === r.id}
                        >
                          {deletingId === r.id ? (
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-destructive/30 border-t-destructive animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════
          VIEW MODAL
      ══════════════════════════════════════ */}
      <Dialog open={!!viewRecord} onOpenChange={(o) => !o && setViewRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary">Record Details</DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <div className="space-y-4 pt-2">
              {fields.map((f) => {
                const val = viewRecord[f.name];
                if (val === undefined || val === null || val === '') return null;
            return (
              <div key={f.id} className="space-y-1">
                <p className="text-xs font-semibold text-primary/70 uppercase tracking-wide">{f.display_name}</p>
                <div className="text-sm text-foreground bg-muted/30 rounded-md px-3 py-2 border border-border/40">
                  {renderViewValue(viewRecord, f)}
                </div>
              </div>
            );
              })}
              {/* Timestamps */}
              {(viewRecord.created_at || viewRecord.updated_at) && (
                <div className="pt-2 border-t border-border/40 flex gap-6 text-xs text-muted-foreground">
                  {viewRecord.created_at && <span>Created: {new Date(viewRecord.created_at).toLocaleString()}</span>}
                  {viewRecord.updated_at && <span>Updated: {new Date(viewRecord.updated_at).toLocaleString()}</span>}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════
          EDIT MODAL
      ══════════════════════════════════════ */}
      <Dialog open={!!editRecord} onOpenChange={(o) => !o && setEditRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary">Edit Record</DialogTitle>
          </DialogHeader>
          {editRecord && (
            <div className="space-y-5 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((f) => (
                  <div
                    key={f.id}
                    className={`space-y-1.5 ${
                      ['Editor', 'JSON', 'Textarea', 'File', 'Image', 'ImageArray', 'Array'].includes(f.field_type)
                        ? 'md:col-span-2'
                        : ''
                    }`}
                  >
                    {f.field_type !== 'Boolean' && (
                      <label className="text-xs font-semibold text-primary/70 uppercase tracking-wide">
                        {f.display_name}
                        {f.is_required && <span className="text-destructive ml-1">*</span>}
                      </label>
                    )}
                    {renderEditField(f)}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                <Button variant="outline" onClick={() => setEditRecord(null)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── View modal value renderer (read-only, rich display) ──
function renderViewValue(record: RecordRow, field: Field) {
  const value = record[field.name];
  if (value === undefined || value === null) return <span className="text-muted-foreground italic">—</span>;

  switch (field.field_type) {
    case 'Boolean':
    return (
        <span className={`inline-flex items-center gap-1 font-medium ${value ? 'text-primary' : 'text-muted-foreground'}`}>
          {value ? '✓ True' : '✗ False'}
        </span>
      );
    case 'Textarea':
      return (
        <div className="whitespace-pre-wrap break-words leading-relaxed">
          {String(value)}
        </div>
      );
    case 'Color':
      return <ColorSwatch color={String(value)} />;
    case 'ImageArray': {
      const urls = Array.isArray(value) ? value.filter(Boolean) : [];
      if (!urls.length) return <span className="text-muted-foreground italic">—</span>;
      return (
        <div className="grid grid-cols-4 gap-2 pt-1">
          {urls.map((url: string, i: number) => (
            <img
              key={i}
              src={url}
              alt={`img-${i + 1}`}
              className="aspect-square w-full rounded object-cover border border-border/60 cursor-pointer hover:opacity-80"
              onClick={() => window.open(url, '_blank')}
            />
          ))}
        </div>
      );
    }
    case 'Image':
    case 'File':
      if (typeof value === 'string' && (value.startsWith('/uploads/') || value.startsWith('http'))) {
        return <FilePreview url={value} fieldType={field.field_type} />;
      }
      return <span>{String(value)}</span>;
    case 'Array': {
      const items = Array.isArray(value) ? value : [];
      if (!items.length) return <span className="text-muted-foreground italic">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {items.map((item: unknown, i: number) => (
            <span key={i} className="inline-flex items-center rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
              {String(item)}
            </span>
          ))}
        </div>
      );
    }
    case 'JSON':
      return (
        <pre className="text-xs font-mono whitespace-pre-wrap break-all">
          {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
        </pre>
      );
    case 'Editor':
      return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: value }} />;
    case 'Date':
    case 'DateTime':
      return <span>{value ? new Date(value).toLocaleString() : '—'}</span>;
    case 'Relation': {
      const populated = record[`${field.name}_populated`];
      if (populated) return <span>{resolvePopulatedLabel(populated)}</span>;
      return <span>{record[`${field.name}_label`] ?? String(value)}</span>;
    }
    default:
      return <span className="break-all">{String(value)}</span>;
  }
}

// ── Table cell value renderer (compact) ──
function resolvePopulatedLabel(obj: any): string {
  if (!obj || typeof obj !== 'object') return '';
  const label = obj.category || obj.category_name || obj.display_name || obj.name || obj.title || obj.label || obj.slug || obj.id;
  const nestedKey = Object.keys(obj).find((k) => k.endsWith('_populated'));
  if (nestedKey && obj[nestedKey]) return `${resolvePopulatedLabel(obj[nestedKey])} › ${label}`;
  return label || 'Unnamed';
}

// Strip HTML tags to plain text for preview
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Check if a string looks like a raw MongoDB ObjectId (24 hex chars)
function isRawObjectId(str: string): boolean {
  return /^[a-f0-9]{24}$/i.test(str);
}

function formatValue(record: RecordRow, field: Field) {
  const value = record[field.name];
  if (value === undefined || value === null) return <span className="text-muted-foreground/50">—</span>;

  if (field.field_type === 'Relation') {
    const populated = record[`${field.name}_populated`];
    if (populated) return <span className="text-sm">{resolvePopulatedLabel(populated)}</span>;

    const label = record[`${field.name}_label`];
    // If label is null, empty, or a raw ObjectId — show a friendly dash
    if (!label || isRawObjectId(String(label))) {
      return <span className="text-muted-foreground/50 text-xs">—</span>;
    }
    return <span className="text-sm">{String(label)}</span>;
  }

  switch (field.field_type) {
    case 'Array':
      if (Array.isArray(value)) {
        if (!value.length) return <span className="text-muted-foreground/50">—</span>;
        return (
          <span className="inline-flex flex-wrap gap-1">
            {value.slice(0, 3).map((item: unknown, i: number) => (
              <span key={i} className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs">
                {String(item)}
              </span>
            ))}
            {value.length > 3 && <span className="text-xs text-muted-foreground">+{value.length - 3}</span>}
          </span>
        );
      }
      return String(value);
    case 'ImageArray': {
      const urls = Array.isArray(value) ? value.filter(Boolean) : [];
      if (!urls.length) return <span className="text-muted-foreground/50">—</span>;
      return (
        <span className="inline-flex items-center gap-1">
          {urls.slice(0, 3).map((url: string, i: number) => (
            <img
              key={i}
              src={url}
              alt={`img-${i + 1}`}
              className="w-8 h-8 rounded object-cover border border-border/60"
            />
          ))}
          {urls.length > 3 && <span className="text-xs text-muted-foreground">+{urls.length - 3}</span>}
        </span>
      );
    }
    case 'Boolean':
      return (
        <span className={`text-xs font-medium ${value ? 'text-primary' : 'text-muted-foreground'}`}>
          {value ? 'True' : 'False'}
        </span>
      );
    case 'JSON':
      try { return <span className="font-mono text-xs truncate">{typeof value === 'string' ? value : JSON.stringify(value)}</span>; }
      catch { return String(value); }
    case 'Date':
    case 'DateTime':
      return value ? new Date(value).toLocaleDateString() : '—';
    case 'File':
    case 'Image':
      if (typeof value === 'string' && (value.startsWith('/uploads/') || value.startsWith('http'))) {
        return <FilePreview url={value} fieldType={field.field_type} />;
      }
      return String(value);
    case 'Editor': {
      // Show a short plain-text preview instead of "Rich text"
      const plain = stripHtml(String(value));
      if (!plain) return <span className="text-muted-foreground/50">—</span>;
      return (
        <span className="text-xs text-muted-foreground truncate max-w-[180px] block" title={plain}>
          {plain.length > 60 ? plain.slice(0, 60) + '…' : plain}
        </span>
      );
    }
    default:
      return <span className="truncate">{String(value)}</span>;
  }
}
