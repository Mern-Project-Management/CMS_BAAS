import type { FieldType } from './types';
import {
  Calendar,
  Clock,
  Code,
  File,
  Hash,
  ImageIcon,
  Link2,
  List,
  ToggleLeft as Toggle2,
  Type,
  PenTool,
  Palette,
  AlignLeft,
} from 'lucide-react';

export const FIELD_TYPES: Record<FieldType, { label: string; description: string }> = {
  Text: { label: 'Text', description: 'Single or multi-line text' },
  Textarea: { label: 'Textarea', description: 'Multi-line text area' },
  Number: { label: 'Number', description: 'Integer or decimal numbers' },
  Boolean: { label: 'Boolean', description: 'True or false value' },
  Date: { label: 'Date', description: 'Date without time' },
  DateTime: { label: 'DateTime', description: 'Date with time' },
  File: { label: 'File', description: 'File upload field' },
  Image: { label: 'Image', description: 'Single image upload' },
  ImageArray: { label: 'Image Array', description: 'Multiple images upload (gallery)' },
  JSON: { label: 'JSON', description: 'Structured JSON data' },
  Relation: { label: 'Relation', description: 'Link to another collection' },
  Array: { label: 'Array', description: 'Multiple values (list of text items)' },
  Editor: { label: 'Editor', description: 'Rich text editor with formatting' },
  Color: { label: 'Color', description: 'Hex color picker for backgrounds and text' },
};

export function getFieldTypeIcon(type: FieldType) {
  const iconProps = { className: 'w-4 h-4' };
  switch (type) {
    case 'Text':
      return <Type {...iconProps} />;
    case 'Number':
      return <Hash {...iconProps} />;
    case 'Boolean':
      return <Toggle2 {...iconProps} />;
    case 'Date':
      return <Calendar {...iconProps} />;
    case 'DateTime':
      return <Clock {...iconProps} />;
    case 'File':
      return <File {...iconProps} />;
    case 'Image':
      return <ImageIcon {...iconProps} />;
    case 'ImageArray':
      return <ImageIcon {...iconProps} />;
    case 'JSON':
      return <Code {...iconProps} />;
    case 'Relation':
      return <Link2 {...iconProps} />;
    case 'Array':
      return <List {...iconProps} />;
    case 'Editor':
      return <PenTool {...iconProps} />;
    case 'Color':
      return <Palette {...iconProps} />;
      case 'Textarea':
  return <AlignLeft {...iconProps} />;
    default:
      return <Type {...iconProps} />;
  }
}

export function validateFieldName(name: string): { valid: boolean; error?: string } {
  if (!name) return { valid: false, error: 'Field name is required' };
  if (!/^[a-z_][a-z0-9_]*$/.test(name.toLowerCase())) {
    return {
      valid: false,
      error:
        'Field name must start with a letter or underscore and contain only alphanumeric characters and underscores',
    };
  }
  if (name.length > 255) {
    return { valid: false, error: 'Field name must be less than 255 characters' };
  }
  return { valid: true };
}

export function validateCollectionName(name: string): { valid: boolean; error?: string } {
  if (!name) return { valid: false, error: 'Collection name is required' };
  if (!/^[a-z_][a-z0-9_]*$/.test(name.toLowerCase())) {
    return { valid: false, error: 'Collection name must start with a letter or underscore' };
  }
  if (name.length > 255) {
    return { valid: false, error: 'Collection name must be less than 255 characters' };
  }
  return { valid: true };
}

export function getValidationRuleLabel(type: string): string {
  const labels: Record<string, string> = {
    min: 'Minimum',
    max: 'Maximum',
    pattern: 'Pattern',
    length: 'Length',
    email: 'Email Format',
    url: 'URL Format',
    custom: 'Custom',
  };
  return labels[type] || type;
}

export function formatCollectionName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export function formatFieldName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

