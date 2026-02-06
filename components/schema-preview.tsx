'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Collection, Field } from '@/lib/types';

interface SchemaPreviewProps {
  collection: Collection;
  fields: Field[];
}

export function SchemaPreview({ collection, fields }: SchemaPreviewProps) {
  const { toast } = useToast();

  // Generate TypeScript interface
  function generateTypeScriptInterface(): string {
    const fieldTypes: Record<string, string> = {
      Text: 'string',
      Number: 'number',
      Boolean: 'boolean',
      Date: 'Date | string',
      DateTime: 'Date | string',
      File: 'File | { url: string; name: string }',
      Image: 'File | { url: string; name: string }',
      JSON: 'Record<string, any>',
      Relation: 'string | object',
      Array: 'string[]',
    };

    let interfaceCode = `export interface ${collection.display_name} {\n`;
    fields.forEach((field) => {
      const tsType = fieldTypes[field.field_type] || 'any';
      const optional = !field.is_required ? '?' : '';
      interfaceCode += `  ${field.name}${optional}: ${tsType};\n`;
    });
    interfaceCode += '}';

    return interfaceCode;
  }

  // Generate JSON Schema
  function generateJSONSchema(): string {
    const schema: any = {
      $schema: 'http://json-schema.org/draft-07/schema#',
      title: collection.display_name,
      type: 'object',
      properties: {},
      required: [],
    };

    fields.forEach((field) => {
      const fieldSchema: any = {
        type: mapFieldTypeToJSONSchema(field.field_type),
        description: field.description || '',
      };
      if (field.field_type === 'Array') {
        fieldSchema.items = { type: 'string' };
      }

      if (field.validation_rules && Array.isArray(field.validation_rules)) {
        const rules = field.validation_rules as any[];
        rules.forEach((rule) => {
          switch (rule.type) {
            case 'min':
              if (field.field_type === 'Number') fieldSchema.minimum = rule.value;
              else fieldSchema.minLength = rule.value;
              break;
            case 'max':
              if (field.field_type === 'Number') fieldSchema.maximum = rule.value;
              else fieldSchema.maxLength = rule.value;
              break;
            case 'pattern':
              fieldSchema.pattern = rule.value;
              break;
          }
        });
      }

      schema.properties[field.name] = fieldSchema;

      if (field.is_required) {
        schema.required.push(field.name);
      }
    });

    return JSON.stringify(schema, null, 2);
  }

  function mapFieldTypeToJSONSchema(fieldType: string): string {
    if (fieldType === 'Array') return 'array'; // items: string in full schema
    const mapping: Record<string, string> = {
      Text: 'string',
      Number: 'number',
      Boolean: 'boolean',
      Date: 'string',
      DateTime: 'string',
      File: 'object',
      Image: 'object',
      JSON: 'object',
      Relation: 'string',
    };
    return mapping[fieldType] || 'string';
  }

  // Generate SQL CREATE TABLE
  function generateSQL(): string {
    let sql = `CREATE TABLE "${collection.name}" (\n`;
    sql += `  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;

    fields.forEach((field, index) => {
      const sqlType = mapFieldTypeToSQL(field.field_type);
      const constraints = [];

      if (field.is_required) constraints.push('NOT NULL');
      if (field.is_unique) constraints.push('UNIQUE');

      sql += `  "${field.name}" ${sqlType}`;
      if (constraints.length > 0) {
        sql += ` ${constraints.join(' ')}`;
      }

      if (index < fields.length - 1) {
        sql += ',';
      }
      sql += '\n';
    });

    sql += `  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n`;
    sql += `  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n`;
    sql += ');';

    return sql;
  }

  function mapFieldTypeToSQL(fieldType: string): string {
    const mapping: Record<string, string> = {
      Text: 'TEXT',
      Number: 'NUMERIC',
      Boolean: 'BOOLEAN',
      Date: 'DATE',
      DateTime: 'TIMESTAMP',
      File: 'TEXT',
      Image: 'TEXT',
      JSON: 'JSONB',
      Relation: 'UUID',
      Array: 'TEXT[]',
    };
    return mapping[fieldType] || 'TEXT';
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Schema copied to clipboard',
    });
  }

  function downloadSchema(format: 'ts' | 'json' | 'sql') {
    let content = '';
    let filename = `${collection.name}_schema`;
    let contentType = 'text/plain';

    switch (format) {
      case 'ts':
        content = generateTypeScriptInterface();
        filename += '.ts';
        break;
      case 'json':
        content = generateJSONSchema();
        filename += '.json';
        contentType = 'application/json';
        break;
      case 'sql':
        content = generateSQL();
        filename += '.sql';
        break;
    }

    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: `Schema downloaded as ${filename}`,
    });
  }

  const tsInterface = generateTypeScriptInterface();
  const jsonSchema = generateJSONSchema();
  const sqlCreate = generateSQL();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schema Preview & Export</CardTitle>
        <CardDescription>
          View and export your schema in different formats
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="typescript" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="typescript">TypeScript</TabsTrigger>
            <TabsTrigger value="json">JSON Schema</TabsTrigger>
            <TabsTrigger value="sql">SQL</TabsTrigger>
          </TabsList>

          <TabsContent value="typescript" className="space-y-3">
            <div className="bg-muted p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm font-mono">{tsInterface}</pre>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(tsInterface)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadSchema('ts')}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="json" className="space-y-3">
            <div className="bg-muted p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm font-mono">{jsonSchema}</pre>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(jsonSchema)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadSchema('json')}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="sql" className="space-y-3">
            <div className="bg-muted p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm font-mono">{sqlCreate}</pre>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(sqlCreate)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadSchema('sql')}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
