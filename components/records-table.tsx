'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { FilePreview } from './file-preview';
import type { Field } from '@/lib/types';

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
};

export function RecordsTable({ collectionId, fields, records, title, hiddenFieldNames = [], onDelete }: Props) {
  console.log("records",records)
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/data/${collectionId}/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete');
      toast({ title: 'Record deleted' });
      onDelete();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title || 'Records'}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {fields
                .filter((f) => !hiddenFieldNames.includes(f.name))
                .map((f) => (
                  <TableHead key={f.id}>{f.display_name}</TableHead>
                ))}
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={fields.filter((f) => !hiddenFieldNames.includes(f.name)).length + 1} className="text-center text-muted-foreground">
                  No records yet.
                </TableCell>
              </TableRow>
            ) : (
              records.map((r) => (
                <TableRow key={r.id}>
                  {fields
                    .filter((f) => !hiddenFieldNames.includes(f.name))
                    .map((f, idx) => (
                      <TableCell key={f.id} className="whitespace-nowrap">
                        {/* Apply layer-wise visual indicators to the first column */}
                        {idx === 0 && r._depth !== undefined && r._depth > 0 && (
                          <span className="text-muted-foreground/60 mr-1 font-mono select-none">
                            {'-'.repeat(r._depth * 2 + 1)}| 
                          </span>
                        )}
                        {formatValue(r, f)}
                      </TableCell>
                    ))}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                    >
                      {deletingId === r.id ? 'Deleting…' : 'Delete'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function resolvePopulatedLabel(obj: any): string {
  if (!obj || typeof obj !== 'object') return '';
  
  // Prioritize specific name fields used in your schema
  const label = 
    obj.category_name ||
    obj.display_name ||
    obj.name ||
    obj.title ||
    obj.label ||
    obj.id;

  // Recursively resolve parent names to show full path in the table
  const nestedKey = Object.keys(obj).find(k => k.endsWith('_populated'));
  if (nestedKey && obj[nestedKey]) {
    return `${resolvePopulatedLabel(obj[nestedKey])} > ${label}`;
  }

  return label || 'Unnamed';
}

function formatValue(record: RecordRow, field: Field) {
  const value = record[field.name];
  if (value === undefined || value === null) return '';

  if (field.field_type === 'Relation') {
    const populated = record[`${field.name}_populated`];
    if (populated) return resolvePopulatedLabel(populated);
    return record[`${field.name}_label`] ?? String(value);
  }

  switch (field.field_type) {
    case 'Array':
      if (Array.isArray(value)) {
        if (value.length === 0) return '—';
        return (
          <span className="inline-flex flex-wrap gap-1">
            {value.map((item: unknown, i: number) => (
              <span
                key={i}
                className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs"
              >
                {String(item)}
              </span>
            ))}
          </span>
        );
      }
      return String(value);
    case 'Boolean':
      return value ? 'True' : 'False';
    case 'JSON':
      try {
        return typeof value === 'string' ? value : JSON.stringify(value);
      } catch {
        return String(value);
      }
    case 'Date':
    case 'DateTime':
      return value ? new Date(value).toLocaleString() : '';
    case 'File':
    case 'Image':
      if (typeof value === 'string' && (value.startsWith('/uploads/') || value.startsWith('http'))) {
        return <FilePreview url={value} fieldType={field.field_type} />;
      }
      return String(value);
    default:
      return String(value);
  }
}
