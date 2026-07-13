'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Field, ValidationRule } from '@/lib/types';

interface FieldRulesPanelProps {
  field: Partial<Field>;
  onChange: (field: Partial<Field>) => void;
}

export function FieldRulesPanel({ field, onChange }: FieldRulesPanelProps) {
  const [validationRules, setValidationRules] = useState<ValidationRule[]>(
    Array.isArray(field.validation_rules) ? (field.validation_rules as ValidationRule[]) : []
  );

  useEffect(() => {
    setValidationRules(
      Array.isArray(field.validation_rules) ? (field.validation_rules as ValidationRule[]) : []
    );
  }, [field.validation_rules]);

  const [newRule, setNewRule] = useState<ValidationRule>({ type: 'min' });

  const handleRuleChange = (rules: ValidationRule[]) => {
    setValidationRules(rules);
    onChange({ ...field, validation_rules: rules });
  };

  const addValidationRule = () => {
    if (newRule.type) {
      handleRuleChange([...validationRules, newRule]);
      setNewRule({ type: 'min', value: '', message: '' });
    }
  };

  const removeValidationRule = (index: number) => {
    handleRuleChange(validationRules.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Field Rules & Validation</CardTitle>
        <CardDescription>Configure constraints and validation for this field</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Rules */}
        <Tabs defaultValue="rules" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rules">Basic Rules</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="required"
                  checked={field.is_required ?? false}
                  onCheckedChange={(checked) =>
                    onChange({ ...field, is_required: checked as boolean })
                  }
                />
                <Label htmlFor="required" className="font-normal cursor-pointer">
                  Required
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="unique"
                  checked={field.is_unique ?? false}
                  onCheckedChange={(checked) =>
                    onChange({ ...field, is_unique: checked as boolean })
                  }
                />
                <Label htmlFor="unique" className="font-normal cursor-pointer">
                  Unique
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="encrypted"
                  checked={field.is_encrypted ?? false}
                  onCheckedChange={(checked) =>
                    onChange({ ...field, is_encrypted: checked as boolean })
                  }
                />
                <Label htmlFor="encrypted" className="font-normal cursor-pointer">
                  Encrypted
                </Label>
              </div>
            </div>

            {field.default_value !== undefined && (
              <div className="pt-4 border-t space-y-2">
                <Label htmlFor="default_value">Default Value (optional)</Label>
                <Input
                  id="default_value"
                  placeholder="Leave empty for no default"
                  value={field.default_value || ''}
                  onChange={(e) =>
                    onChange({ ...field, default_value: e.target.value })
                  }
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            {/* ── Default limits banner ── */}
            {(['Text', 'Textarea', 'Editor'] as const).includes(field.field_type as any) && (() => {
              const DEFAULTS: Record<string, { min: number; max: number }> = {
                Text:     { min: 3,  max: 100   },
                Textarea: { min: 10, max: 5000  },
                Editor:   { min: 20, max: 50000 },
              };
              const d = DEFAULTS[field.field_type as string];
              const hasMin       = validationRules.some((r) => r.type === 'min');
              const hasMax       = validationRules.some((r) => r.type === 'max');
              const hasAlphanum  = validationRules.some((r) => r.type === 'alphanumeric');
              const hasPattern   = validationRules.some((r) => r.type === 'pattern');
              const showLetterRule = field.field_type === 'Text' || field.field_type === 'Textarea';
              if (!d) return null;
              return (
                <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-3 text-xs space-y-2">
                  <p className="font-semibold text-blue-700 dark:text-blue-300">
                    📏 Default Validation Rules (applied automatically)
                  </p>
                  <div className="flex gap-4 text-blue-600 dark:text-blue-400">
                    <span>
                      Min: <strong>{d.min}</strong>{' '}
                      {hasMin && <span className="text-orange-500">(overridden)</span>}
                    </span>
                    <span>
                      Max: <strong>{d.max}</strong>{' '}
                      {hasMax && <span className="text-orange-500">(overridden)</span>}
                    </span>
                  </div>
                  {showLetterRule && (
                    <div className="text-blue-600 dark:text-blue-400">
                      🔤 Must contain at least one letter — pure numbers (e.g. <code>12213</code>) are rejected{' '}
                      {(hasAlphanum || hasPattern) && <span className="text-orange-500">(overridden by your rule)</span>}
                    </div>
                  )}
                  <p className="text-blue-500 dark:text-blue-400 pt-0.5">
                    Add <strong>Minimum</strong>, <strong>Maximum</strong>, <strong>Alphanumeric</strong>, or <strong>Pattern</strong> rules below to override these defaults.
                  </p>
                </div>
              );
            })()}

            {/* ── Auto slug banner ── */}
            {(field.field_type === 'Text' || field.field_type === 'Textarea') &&
              (field.name === 'slug' || (typeof field.name === 'string' && field.name.endsWith('_slug'))) && (() => {
                const hasSlugOverride = validationRules.some(
                  (r) => r.type === 'slug' || r.type === 'pattern' || r.type === 'alphanumeric'
                );
                return (
                  <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-xs space-y-1.5">
                    <p className="font-semibold text-amber-700 dark:text-amber-300">
                      🔗 Slug Validation (auto-applied)
                    </p>
                    <p className="text-amber-600 dark:text-amber-400">
                      Only <strong>lowercase letters</strong>, <strong>numbers</strong>, and <strong>hyphens</strong> allowed.
                      Spaces, uppercase, special characters, and script tags are all rejected.{' '}
                      {hasSlugOverride && <span className="text-orange-500">(overridden by your rule)</span>}
                    </p>
                    <p className="text-amber-500">
                      e.g. <code>our-services</code>, <code>service-123</code>
                    </p>
                  </div>
                );
              })()}
            {/* ── Auto schema banner ── */}
            {(field.field_type === 'Text' || field.field_type === 'Textarea' || field.field_type === 'JSON') &&
              (field.name === 'schema' || (typeof field.name === 'string' && field.name.endsWith('_schema'))) && (() => {
                const hasSchemaOverride = validationRules.some(
                  (r) => r.type === 'json_ld' || r.type === 'pattern' || r.type === 'custom'
                );
                return (
                  <div className="rounded-md border border-purple-200 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-800 p-3 text-xs space-y-1.5">
                    <p className="font-semibold text-purple-700 dark:text-purple-300">
                      📄 JSON-LD Schema Validation (auto-applied)
                    </p>
                    <p className="text-purple-600 dark:text-purple-400">
                      Only valid <strong>JSON-LD format</strong> referencing <code>schema.org</code> with a valid <code>@context</code> and <code>@type</code> is allowed.
                      HTML, plain text, and malformed JSON structures are rejected.{' '}
                      {hasSchemaOverride && <span className="text-orange-500">(overridden by your rule)</span>}
                    </p>
                    <p className="text-purple-500">
                      e.g. <code>{"{"}"@context": "https://schema.org", "@type": "Service", ...{"}"}</code>
                    </p>
                  </div>
                );
              })()}

            <div className="space-y-3">
              {Array.isArray(validationRules) && validationRules.map((rule, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">{rule.type}</Label>
                    {!['email', 'url', 'alphanumeric', 'no_script_tags', 'json_ld', 'slug'].includes(rule.type) && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Value"
                          value={rule.value?.toString() || ''}
                          onChange={(e) => {
                            const updated = [...validationRules];
                            updated[index] = {
                              ...rule,
                              value: isNaN(Number(e.target.value))
                                ? e.target.value
                                : Number(e.target.value),
                            };
                            handleRuleChange(updated);
                          }}
                        />
                      </div>
                    )}
                    <Input
                      placeholder="Error message"
                      value={rule.message || ''}
                      onChange={(e) => {
                        const updated = [...validationRules];
                        updated[index] = { ...rule, message: e.target.value };
                        handleRuleChange(updated);
                      }}
                      className="text-xs"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeValidationRule(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              <div className="pt-2 space-y-2 bg-muted/30 p-3 rounded">
                <Label htmlFor="rule-type" className="text-xs">
                  Add Validation Rule
                </Label>
                <select
                  id="rule-type"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  value={newRule.type}
                  onChange={(e) =>
                    setNewRule({
                      type: e.target.value as ValidationRule['type'],
                      value: '',
                      message: '',
                    })
                  }
                >
                  <option value="min">Minimum</option>
                  <option value="max">Maximum</option>
                  <option value="pattern">Pattern</option>
                  <option value="length">Length</option>
                  <option value="email">Email Format</option>
                  <option value="url">URL Format</option>
                  <option value="alphanumeric">Alphanumeric (Letters, Numbers, Spaces, Hyphens & Punctuation)</option>
                  <option value="slug">Slug (lowercase, numbers & hyphens only)</option>
                  <option value="no_script_tags">No Script/HTML Tags</option>
                  <option value="json_ld">JSON-LD Schema (schema.org)</option>
                  <option value="custom">Custom</option>
                </select>

                {['min', 'max', 'length', 'pattern', 'custom'].includes(newRule.type || '') && (
                  <div className="space-y-1">
                    <Label className="text-xs">Rule Value</Label>
                    <Input
                      type={['min', 'max', 'length'].includes(newRule.type || '') ? 'number' : 'text'}
                      placeholder={
                        newRule.type === 'min' || newRule.type === 'max'
                          ? 'e.g. 5'
                          : newRule.type === 'length'
                          ? 'e.g. 10'
                          : 'Rule Value'
                      }
                      value={newRule.value?.toString() || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewRule((prev) => ({
                          ...prev,
                          value: ['min', 'max', 'length'].includes(prev.type || '')
                            ? val === '' ? '' : Number(val)
                            : val,
                        }));
                      }}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">Custom Error Message (optional)</Label>
                  <Input
                    placeholder="e.g. Must be at least 5 characters"
                    value={newRule.message || ''}
                    onChange={(e) =>
                      setNewRule((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                  />
                </div>

                <Button
                  type="button"
                  onClick={addValidationRule}
                  size="sm"
                  className="w-full gap-2 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Rule
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
