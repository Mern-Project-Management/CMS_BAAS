'use client';

import React from "react"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FieldTypeSelector } from './field-type-selector';
import { FieldRulesPanel } from './field-rules-panel';
import { useToast } from '@/hooks/use-toast';
import type { FieldType, Field, Collection } from '@/lib/types';

interface EditFieldDialogProps {
  field: Field | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (field: Field) => void;
}

export function EditFieldDialog({ field, open, onOpenChange, onSuccess }: EditFieldDialogProps) {
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [formData, setFormData] = useState<Partial<Field>>({
    name: '',
    display_name: '',
    field_type: 'Text' as FieldType,
    description: '',
    is_required: false,
    is_unique: false,
    is_encrypted: false,
    validation_rules: [],
    relation_to_collection: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open && field) {
      setFormData({
        name: field.name,
        display_name: field.display_name,
        field_type: field.field_type,
        description: field.description || '',
        is_required: field.is_required,
        is_unique: field.is_unique,
        is_encrypted: field.is_encrypted,
        validation_rules: field.validation_rules || [],
        relation_to_collection: field.relation_to_collection || '',
      });
    }
  }, [open, field]);

  useEffect(() => {
    if (open && field && collections.length === 0) {
      fetchCollections();
    }
  }, [open]);

  async function fetchCollections() {
    try {
      const response = await fetch('/api/collections');
      const result = await response.json();
      if (result.success) {
        setCollections(result.data || []);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch collections for relation field',
        variant: 'destructive',
      });
      console.error('Failed to fetch collections', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!field) return;
    setLoading(true);

    try {
      if (!formData.name || !formData.display_name) {
        throw new Error('Name and display name are required');
      }

      const response = await fetch(`/api/fields/${field.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update field');
      }

      toast({
        title: 'Success',
        description: 'Field updated successfully',
      });

      onOpenChange(false);
      if (onSuccess && result.data) {
        onSuccess(result.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update field',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  if (!field) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Field</DialogTitle>
          <DialogDescription>
            Update field properties
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

          {formData.field_type === 'Relation' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
              <Label>Relation to Collection</Label>
              <Select
                value={formData.relation_to_collection}
                onValueChange={(val) =>
                  setFormData({ ...formData, relation_to_collection: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target collection..." />
                </SelectTrigger>
                <SelectContent>
                  {collections.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.display_name} ({c.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Updating…
                </span>
              ) : 'Update Field'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
