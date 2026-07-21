'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import type { Field, ValidationRule } from '@/lib/types';

interface FieldRulesPanelProps {
  field: Partial<Field>;
  onChange: (field: Partial<Field>) => void;
}

export function FieldRulesPanel({ field, onChange }: FieldRulesPanelProps) {
  const [validationRules, setValidationRules] = useState<ValidationRule[]>(
    Array.isArray(field.validation_rules) ? (field.validation_rules as ValidationRule[]) : []
  );
  const [newRule, setNewRule] = useState<ValidationRule>({ type: 'min' });

  const handleRuleChange = (rules: ValidationRule[]) => {
    setValidationRules(rules);
    onChange({ ...field, validation_rules: rules });
  };

  const addValidationRule = () => {
    if (newRule.type) {
      handleRuleChange([...validationRules, newRule]);
      setNewRule({ type: 'min' });
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
            <div className="space-y-3">
              {Array.isArray(validationRules) && validationRules.map((rule, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">{rule.type}</Label>
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
                      ...newRule,
                      type: e.target.value as ValidationRule['type'],
                    })
                  }
                >
                  <option value="min">Minimum</option>
                  <option value="max">Maximum</option>
                  <option value="pattern">Pattern</option>
                  <option value="length">Length</option>
                  <option value="email">Email Format</option>
                  <option value="url">URL Format</option>
                  <option value="custom">Custom</option>
                </select>
                <Button
                  onClick={addValidationRule}
                  size="sm"
                  className="w-full gap-2"
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
