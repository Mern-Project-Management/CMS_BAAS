'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUpload } from '@/components/file-upload';
import { TipTapEditor } from '@/components/tiptap-editor';
import { useToast } from '@/hooks/use-toast';
import { HierarchicalSelector } from '@/components/hierarchical-selector';
import { Plus, Trash2 } from 'lucide-react';
import type { Field } from '@/lib/types';

type Props = {
  collectionId: string;
  fields: Field[];
  onCreated: () => void;
};

export function RecordForm({ collectionId, fields, onCreated }: Props) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  function updateField(name: string, value: any) {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Normalize form data: filter out empty array items for Array fields so we store clean arrays
      const payload: Record<string, unknown> = {};
      for (const field of fields) {
        const v = formData[field.name];
        if (field.field_type === 'Array') {
          const arr = ensureArray(v);
          payload[field.name] = arr.filter((s) => s.trim() !== '');
        } else {
          payload[field.name] = v;
        }
      }
      const res = await fetch(`/api/data/${collectionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create record');
      }
      toast({ title: 'Record created' });
      setFormData({});
      onCreated();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create record',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function ensureArray(value: unknown): string[] {
    if (Array.isArray(value)) return value.map((v) => (v != null ? String(v) : ''));
    if (value === undefined || value === null) return [];
    return [String(value)];
  }

  function renderField(field: Field) {
    const value = formData[field.name] ?? '';
    switch (field.field_type) {
      case 'Array': {
        const items = ensureArray(formData[field.name]);
        return (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => {
                    const next = [...items];
                    next[index] = e.target.value;
                    updateField(field.name, next);
                  }}
                  placeholder={`Item ${index + 1}`}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const next = items.filter((_, i) => i !== index);
                    updateField(field.name, next.length ? next : []);
                  }}
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => updateField(field.name, [...items, ''])}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              Add item
            </Button>
          </div>
        );
      }
      case 'Boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={!!value}
              onCheckedChange={(checked) => updateField(field.name, !!checked)}
            />
            <label htmlFor={field.name} className="text-sm font-medium leading-none">
              {field.display_name} {field.is_required && <span className="text-destructive">*</span>}
            </label>
          </div>
        );
      case 'Number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => updateField(field.name, e.target.value === '' ? '' : Number(e.target.value))}
            required={field.is_required}
            placeholder={field.display_name}
          />
        );
      case 'Date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => updateField(field.name, e.target.value)}
            required={field.is_required}
          />
        );
      case 'DateTime':
        return (
          <Input
            type="datetime-local"
            value={value}
            onChange={(e) => updateField(field.name, e.target.value)}
            required={field.is_required}
          />
        );
      case 'JSON':
        return (
          <Textarea
            value={value}
            onChange={(e) => updateField(field.name, e.target.value)}
            required={field.is_required}
            placeholder="JSON string"
          />
        );
      case 'File':
      case 'Image':
        return (
          <FileUpload
            field={field}
            value={value}
            onChange={(url) => updateField(field.name, url)}
            required={field.is_required}
          />
        );
      case 'Editor':
        return (
          <TipTapEditor
            content={value || ''}
            onChange={(html) => updateField(field.name, html)}
            placeholder={`Enter ${field.display_name.toLowerCase()}...`}
          />
        );
      case 'Relation':
        if (!field.relation_to_collection) {
          console.warn(`Relation field '${field.name}' has no relation_to_collection configured.`);
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
            onSelect={(selectedId, fullPath) => {
              updateField(field.name, selectedId);
              if (fullPath && Array.isArray(fullPath)) {
                console.log(`Selected ID: ${selectedId}`);
                console.log('Full Path:', fullPath.map((item: any) => item.display_name || item.name || item.category_name || item.id).join(' > '));
              }
              // If you wanted to store the full path, you'd need another field (e.g., JSON or Array)
              // For example: updateField(`${field.name}_path`, fullPath);
            }}
            placeholder={`Select ${field.display_name}...`}
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => updateField(field.name, e.target.value)}
            required={field.is_required}
            placeholder={field.display_name}
          />
        );
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          {field.field_type !== 'Boolean' && (
            <label className="text-sm font-medium">
              {field.display_name} {field.is_required && <span className="text-destructive">*</span>}
            </label>
          )}
          {renderField(field)}
          {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
        </div>
      ))}

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Create Record'}
      </Button>
    </form>
  );
}
