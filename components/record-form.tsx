'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUpload } from '@/components/file-upload';
import { MultiImageUpload } from '@/components/multi-image-upload';
import { TipTapEditor } from '@/components/tiptap-editor';
import { ColorField } from '@/components/color-field';
import { useToast } from '@/hooks/use-toast';
import { HierarchicalSelector } from '@/components/hierarchical-selector';
import { PageRouteSelector } from '@/components/page-route-selector';
import { Plus, Trash2 } from 'lucide-react';
import type { Field } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

import { FaqPageSelector } from '@/components/faq-page-selector';

const slugify = (str: string) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

type Props = {
  collectionId: string;
  fields: Field[];
  onCreated: () => void;
  defaultValues?: Record<string, any>;
};

export function RecordForm({ collectionId, fields, onCreated, defaultValues }: Props) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>(defaultValues || {});
  const [formKey, setFormKey] = useState(0);

  const isFaqCollection = collectionId === 'faq' || collectionId === '6a477a863042d14bb0be8de2';
  const [faqItems, setFaqItems] = useState<Array<{ question: string; ans: string }>>([
    { question: '', ans: '' }
  ]);
  const [selectedPage, setSelectedPage] = useState<string>(defaultValues?.page || 'home');

  function updateField(name: string, value: any) {
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      
      // Auto-generate slug if it exists in fields and source is a "name" field
      if (['name', 'title', 'display_name', 'category'].includes(name) && fields.some(f => f.name === 'slug')) {
        next['slug'] = slugify(String(value));
      }

      // Auto-generate category_slug if category_name is changed
      if (name === 'category_name' && fields.some(f => f.name === 'category_slug')) {
        next['category_slug'] = slugify(String(value));
      }

      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      let payload: any;
      if (isFaqCollection) {
        // Filter out empty items
        const activeItems = faqItems.filter(item => item.question.trim() !== '' || item.ans.trim() !== '');
        if (activeItems.length === 0) {
          throw new Error('Please add at least one FAQ question and answer');
        }
        payload = activeItems.map(item => ({
          page: selectedPage,
          question: item.question,
          ans: item.ans
        }));
      } else {
        // Normalize form data: filter out empty array items for Array fields so we store clean arrays
        const normalPayload: Record<string, unknown> = {};
        for (const field of fields) {
          const v = formData[field.name];
          if (field.field_type === 'Array') {
            const arr = ensureArray(v);
            normalPayload[field.name] = arr.filter((s) => s.trim() !== '');
          } else if (field.field_type === 'ImageArray') {
            // Already an array of URL strings — store as-is
            normalPayload[field.name] = Array.isArray(v) ? v.filter(Boolean) : [];
          } else {
            normalPayload[field.name] = v;
          }
        }
        payload = normalPayload;
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
      toast({ title: isFaqCollection ? `${faqItems.length} FAQs created` : 'Record created', variant: 'success' });
      setFormData(defaultValues || {});
      setFaqItems([{ question: '', ans: '' }]);
      setFormKey((prev) => prev + 1);
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
    const isFaqPageField = field.name === 'page' && (collectionId === 'faq' || collectionId === '6a477a863042d14bb0be8de2');
    
    if (isFaqPageField) {
      return (
        <FaqPageSelector
          value={value}
          onChange={(val) => updateField(field.name, val)}
          required={field.is_required}
        />
      );
    }

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
      case 'Color':
        return (
          <ColorField
            value={typeof value === 'string' ? value : ''}
            onChange={(hex) => updateField(field.name, hex)}
          />
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
      case 'Textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => updateField(field.name, e.target.value)}
            required={field.is_required}
            placeholder={field.display_name}
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
      case 'ImageArray':
        return (
          <MultiImageUpload
            value={Array.isArray(formData[field.name]) ? formData[field.name] : []}
            onChange={(urls) => updateField(field.name, urls)}
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
      case 'PageRoute':
        return (
          <PageRouteSelector
            value={value}
            onChange={(route) => updateField(field.name, route)}
            required={field.is_required}
            collectionId={collectionId}
            fieldName={field.name}
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

  if (isFaqCollection) {
    return (
      <form 
        key={formKey} 
        className="space-y-6" 
        onSubmit={handleSubmit}
        noValidate
        autoComplete="off"
      >
        <div className="space-y-4">
          {!defaultValues?.page ? (
            <div className="space-y-2 max-w-md">
              <label className="text-sm font-semibold text-primary/80 uppercase tracking-wide">
                Page <span className="text-destructive">*</span>
              </label>
              <FaqPageSelector
                value={selectedPage}
                onChange={(val) => setSelectedPage(val)}
                required
              />
              <p className="text-xs text-muted-foreground">Select which page this batch of FAQs belongs to.</p>
            </div>
          ) : (
            <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-primary/70 uppercase tracking-wide block">Target Page</span>
                <span className="font-mono text-sm font-bold text-foreground">/{defaultValues.page.replace(/^\//, '')}</span>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10">Page-Locked</Badge>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-border/40">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">FAQ Entries ({faqItems.length})</h3>
            
            {faqItems.map((item, idx) => (
              <div key={idx} className="relative p-4 rounded-xl border border-border bg-card shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">FAQ #{idx + 1}</span>
                  {faqItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFaqItems(prev => prev.filter((_, i) => i !== idx));
                      }}
                      className="text-destructive hover:bg-destructive/10 h-8 px-2.5"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Question</label>
                    <Input
                      value={item.question}
                      onChange={(e) => {
                        const next = [...faqItems];
                        next[idx].question = e.target.value;
                        setFaqItems(next);
                      }}
                      placeholder="e.g. What is your warranty policy?"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Answer</label>
                    <Textarea
                      value={item.ans}
                      onChange={(e) => {
                        const next = [...faqItems];
                        next[idx].ans = e.target.value;
                        setFaqItems(next);
                      }}
                      placeholder="e.g. We offer a 1-year comprehensive warranty on all machinery parts..."
                      rows={3}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setFaqItems(prev => [...prev, { question: '', ans: '' }])}
            className="w-full sm:w-auto gap-2 border-dashed mt-2"
          >
            <Plus className="w-4 h-4" />
            Add Another FAQ Item
          </Button>
        </div>

        <Button type="submit" disabled={submitting} className="w-full sm:w-auto mt-6 px-8 shadow-sm">
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              Saving FAQs…
            </span>
          ) : 'Save FAQs'}
        </Button>
      </form>
    );
  }

  return (
    <form 
      key={formKey} 
      className="space-y-6" 
      onSubmit={handleSubmit}
      noValidate
      autoComplete="off"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {fields.map((field) => (
        <div 
          key={field.id} 
          className={`space-y-2 ${['Editor', 'JSON', 'Textarea', 'File', 'Image', 'ImageArray', 'Array'].includes(field.field_type as string) ? 'md:col-span-2' : ''}`}
        >
          {field.field_type !== 'Boolean' && (
            <label className="text-sm font-medium">
              {field.display_name} {field.is_required && <span className="text-destructive">*</span>}
            </label>
          )}
          {renderField(field)}
          {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
        </div>
      ))}
      </div>

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto mt-4 px-8 shadow-sm">
        {submitting ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
            Saving…
          </span>
        ) : 'Create Record'}
      </Button>
    </form>
  );
}
