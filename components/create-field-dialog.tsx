'use client';

import React from "react"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FieldTypeSelector } from './field-type-selector';
import { FieldRulesPanel } from './field-rules-panel';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { FieldType, Field } from '@/lib/types';

interface CreateFieldDialogProps {
  collectionId: string;
  onSuccess?: (field: Field) => void;
}

export function CreateFieldDialog({ collectionId, onSuccess }: CreateFieldDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Field>>({
    collection_id: collectionId,
    name: '',
    display_name: '',
    field_type: 'Text' as FieldType,
    description: '',
    is_required: false,
    is_unique: false,
    is_encrypted: false,
    validation_rules: [],
  });
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.name || !formData.display_name) {
        throw new Error('Name and display name are required');
      }

      const response = await fetch('/api/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          collection_id: collectionId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create field');
      }

      toast({
        title: 'Success',
        description: 'Field created successfully',
      });

      setFormData({
        collection_id: collectionId,
        name: '',
        display_name: '',
        field_type: 'Text',
        description: '',
        is_required: false,
        is_unique: false,
        is_encrypted: false,
        validation_rules: [],
      });
      setOpen(false);

      if (onSuccess && result.data) {
        onSuccess(result.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create field',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Field
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Field</DialogTitle>
          <DialogDescription>
            Define a new field for your collection
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Field Name</Label>
              <Input
                id="name"
                placeholder="e.g., user_email, product_id"
                value={formData.name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Lowercase, letters, numbers, underscores only
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                placeholder="e.g., User Email, Product ID"
                value={formData.display_name || ''}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Field Type</Label>
            <FieldTypeSelector
              value={formData.field_type as FieldType}
              onChange={(type) => setFormData({ ...formData, field_type: type })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what this field stores..."
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={2}
            />
          </div>

          <FieldRulesPanel
            field={formData}
            onChange={(updated) => setFormData(updated)}
          />

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Field'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
