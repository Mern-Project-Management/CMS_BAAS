'use client';

import type { FieldType } from '@/lib/types';
import { FIELD_TYPES, getFieldTypeIcon } from '@/lib/field-utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface FieldTypeSelectorProps {
  value: FieldType;
  onChange: (type: FieldType) => void;
}

const FIELD_GROUPS: Record<string, FieldType[]> = {
  'Basic': ['Text', 'Textarea', 'Number', 'Boolean', 'Color', 'Dropdown'],
  'Date & Time': ['Date', 'DateTime'],
  'Media': ['File', 'Image', 'ImageArray'],
  'Advanced': ['JSON', 'Relation', 'Array', 'Editor'],
};

export function FieldTypeSelector({ value, onChange }: FieldTypeSelectorProps) {
  const currentTypeInfo = FIELD_TYPES[value];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between bg-transparent text-black"
        >
          <span className="flex items-center gap-2">
            {getFieldTypeIcon(value)}
            {currentTypeInfo?.label ?? value}
          </span>
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 max-h-[min(80vh,24rem)] overflow-y-auto">
        {Object.entries(FIELD_GROUPS).map(([group, types]) => (
          <div key={group}>
            <DropdownMenuLabel className="text-xs uppercase font-semibold text-muted-foreground">
              {group}
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {types.map((fieldType) => {
                const typeInfo = FIELD_TYPES[fieldType];

                if (!typeInfo) {
                  console.warn(`FieldTypeSelector: no entry in FIELD_TYPES for "${fieldType}"`);
                  return null;
                }

                return (
                  <DropdownMenuItem
                    key={fieldType}
                    onClick={() => onChange(fieldType)}
                    className={value === fieldType ? 'bg-accent' : ''}
                  >
                    <span className="flex items-center gap-3 w-full">
                      {getFieldTypeIcon(fieldType)}
                      <div className="flex-1">
                        <div className="font-medium">{typeInfo.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {typeInfo.description}
                        </div>
                      </div>
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}