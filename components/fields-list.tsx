'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Edit2, Trash2, Lock, AlertCircle, GripVertical } from 'lucide-react';
import { getFieldTypeIcon } from '@/lib/field-utils';
import { cn } from '@/lib/utils';
import type { Field } from '@/lib/types';

interface FieldsListProps {
  fields: Field[];
  onDelete?: () => void;
  onEdit?: (field: Field) => void;
  onReorder?: () => void;
}

export function FieldsList({ fields, onDelete, onEdit, onReorder }: FieldsListProps) {
  const { toast } = useToast();

  // ── Ordered local state ──
  const itemsRef = useRef<Field[]>(
    [...fields].sort((a, b) => (a.field_order ?? 0) - (b.field_order ?? 0))
  );
  const [items, setItems] = useState<Field[]>(itemsRef.current);

  // Helper: update both ref and state atomically
  function applyItems(next: Field[]) {
    itemsRef.current = next; // sync update — always current before any event fires
    setItems(next);
  }

  // Sync when parent adds/removes fields (not during drag)
  const draggingRef = useRef(false);
  const prevIds = useRef(fields.map(f => f.id).join(','));
  const newIds = fields.map(f => f.id).join(',');
  if (!draggingRef.current && prevIds.current !== newIds) {
    prevIds.current = newIds;
    const sorted = [...fields].sort((a, b) => (a.field_order ?? 0) - (b.field_order ?? 0));
    applyItems(sorted);
  }

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  // ── Drag state (all in refs — no re-renders during drag) ──
  const dragFromIndex = useRef<number | null>(null);
  const dragToIndex = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);   // dragged row highlight
  const [overIndex, setOverIndex] = useState<number | null>(null);       // drop-target highlight
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  // ── Persist to server ──
  const persistOrder = useCallback(async (finalItems: Field[]) => {
    setSavingOrder(true);
    try {
      const payload = finalItems.map((f, i) => ({ id: f.id, field_order: i }));
      const res = await fetch('/api/fields', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to save order');
      toast({ title: 'Field order saved' });
      // Update field_order values in local state so sync guard stays stable
      applyItems(finalItems.map((f, i) => ({ ...f, field_order: i })));
      onReorder?.();
    } catch (err) {
      toast({
        title: 'Error saving order',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSavingOrder(false);
    }
  }, [onReorder, toast]);

  // ── Pointer-based drag (reliable on table rows) ──
  function getRowIndexAtY(y: number): number | null {
    for (let i = 0; i < rowRefs.current.length; i++) {
      const el = rowRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) return i;
    }
    return null;
  }

  function handlePointerDown(e: React.PointerEvent, index: number) {
    // Only start drag from the grip handle (first cell)
    const target = e.target as HTMLElement;
    if (!target.closest('[data-drag-handle]')) return;

    e.preventDefault();
    draggingRef.current = true;
    dragFromIndex.current = index;
    dragToIndex.current = index;
    setActiveIndex(index);
    setOverIndex(index);

    const el = rowRefs.current[index];
    el?.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent, index: number) {
    if (!draggingRef.current || dragFromIndex.current === null) return;
    e.preventDefault();

    const hovered = getRowIndexAtY(e.clientY);
    if (hovered === null || hovered === dragToIndex.current) return;

    dragToIndex.current = hovered;
    setOverIndex(hovered);

    // Reorder items live — update ref synchronously so handlePointerUp always has latest
    const current = itemsRef.current;
    const next = [...current];
    const [moved] = next.splice(dragFromIndex.current!, 1);
    next.splice(hovered, 0, moved);
    dragFromIndex.current = hovered;
    applyItems(next);
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setActiveIndex(null);
    setOverIndex(null);
    dragFromIndex.current = null;
    dragToIndex.current = null;

    // Use the ref which always has the latest items
    persistOrder(itemsRef.current);
  }

  // ── Delete ──
  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/fields/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete field');
      toast({ title: 'Success', description: 'Field deleted successfully' });
      onDelete?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete field',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No fields yet. Add your first field to get started!</p>
      </div>
    );
  }

  return (
    <div className="border border-border/60 rounded-lg overflow-hidden">
      {savingOrder && (
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b border-primary/10 text-xs text-primary/70">
          <span className="w-3 h-3 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          Saving order…
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 px-2" />
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Rules</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((field, index) => (
              <TableRow
                key={field.id}
                ref={el => { rowRefs.current[index] = el; }}
                onPointerDown={e => handlePointerDown(e, index)}
                onPointerMove={e => handlePointerMove(e, index)}
                onPointerUp={handlePointerUp}
                className={cn(
                  'select-none transition-colors',
                  activeIndex === index && 'opacity-50 bg-primary/5',
                  overIndex === index && activeIndex !== index && 'bg-primary/10 border-t-2 border-primary/50',
                )}
                style={{ touchAction: 'none' }}
              >
                {/* Grip handle */}
                <TableCell className="px-2 w-10">
                  <div
                    data-drag-handle
                    className="flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-primary/70 transition-colors py-2"
                    title="Drag to reorder"
                  >
                    <GripVertical className="w-4 h-4 pointer-events-none" />
                  </div>
                </TableCell>

                {/* Name */}
                <TableCell>
                  <div>
                    <p className="font-medium">{field.display_name}</p>
                    <p className="text-xs text-muted-foreground">{field.name}</p>
                  </div>
                </TableCell>

                {/* Type */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getFieldTypeIcon(field.field_type)}
                    <span className="text-sm">{field.field_type}</span>
                  </div>
                </TableCell>

                {/* Rules */}
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {field.is_required && (
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                        Required
                      </Badge>
                    )}
                    {field.is_unique && (
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                        Unique
                      </Badge>
                    )}
                    {field.is_encrypted && (
                      <Badge variant="secondary" className="text-xs gap-1 bg-primary/10 text-primary border-primary/20">
                        <Lock className="w-3 h-3" />
                        Encrypted
                      </Badge>
                    )}
                    {(field.validation_rules as any)?.length > 0 && (
                      <Badge variant="secondary" className="text-xs gap-1 bg-primary/10 text-primary border-primary/20">
                        <AlertCircle className="w-3 h-3" />
                        {(field.validation_rules as any).length} Rules
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-primary/10 hover:text-primary"
                      onPointerDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); onEdit?.(field); }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === field.id}
                          className="hover:bg-destructive/10 hover:text-destructive"
                          onPointerDown={e => e.stopPropagation()}
                          onClick={e => e.stopPropagation()}
                        >
                          {deletingId === field.id ? (
                            <span className="w-4 h-4 rounded-full border-2 border-destructive/30 border-t-destructive animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onPointerDown={e => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Field</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{field.display_name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex justify-end gap-2">
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(field.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="px-4 py-2 border-t border-border/40 bg-muted/10">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <GripVertical className="w-3 h-3" />
          Drag the grip handle to reorder fields. Order saves automatically.
        </p>
      </div>
    </div>
  );
}
