'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Edit2,
  Trash2,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getFieldTypeIcon } from '@/lib/field-utils';
import type { Field } from '@/lib/types';

interface FieldsListProps {
  fields: Field[];
  onDelete?: () => void;
  onEdit?: (field: Field) => void;
}

export function FieldsList({ fields, onDelete, onEdit }: FieldsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const response = await fetch(`/api/fields/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete field');
      }

      toast({
        title: 'Success',
        description: 'Field deleted successfully',
      });

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

  if (fields.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No fields yet. Add your first field to get started!</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Rules</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field) => (
              <TableRow
                key={field.id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() =>
                  setExpandedId(expandedId === field.id ? null : field.id)
                }
              >
                <TableCell>
                  <div>
                    <p className="font-medium">{field.display_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {field.name}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getFieldTypeIcon(field.field_type)}
                    <span className="text-sm">{field.field_type}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {field.is_required && (
                      <Badge variant="secondary" className="text-xs">
                        Required
                      </Badge>
                    )}
                    {field.is_unique && (
                      <Badge variant="secondary" className="text-xs">
                        Unique
                      </Badge>
                    )}
                    {field.is_encrypted && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Lock className="w-3 h-3" />
                        Encrypted
                      </Badge>
                    )}
                    {(field.validation_rules as any)?.length > 0 && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {(field.validation_rules as any).length} Rules
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(field);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === field.id}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
}
