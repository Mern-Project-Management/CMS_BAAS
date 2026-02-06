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
  data: Record<string, any>;
  created_at?: string;
  updated_at?: string;
};

type Props = {
  collectionId: string;
  fields: Field[];
  records: RecordRow[];
  onDelete: () => void;
};

export function RecordsTable({ collectionId, fields, records, onDelete }: Props) {
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
        <CardTitle>Records</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {fields.map((f) => (
                <TableHead key={f.id}>{f.display_name}</TableHead>
              ))}
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={fields.length + 1} className="text-center text-muted-foreground">
                  No records yet.
                </TableCell>
              </TableRow>
            ) : (
              records.map((r) => (
                <TableRow key={r.id}>
                  {fields.map((f) => (
                    <TableCell key={f.id}>
                      {formatValue(r.data?.[f.name], f.field_type)}
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

function formatValue(value: any, fieldType: string) {
  if (value === undefined || value === null) return '';
  switch (fieldType) {
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
        return <FilePreview url={value} fieldType={fieldType} />;
      }
      return String(value);
    default:
      return String(value);
  }
}

