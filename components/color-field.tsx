'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

function normalizeHex(value: string): string {
  if (!value) return '#000000';
  const v = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v;
  if (/^#[0-9A-Fa-f]{3}$/.test(v)) return v;
  if (/^[0-9A-Fa-f]{6}$/.test(v)) return `#${v}`;
  return '#000000';
}

export interface ColorFieldProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export function ColorField({ value, onChange, label, className, disabled }: ColorFieldProps) {
  const hex = normalizeHex(value || '#000000');

  return (
    <div className={cn('space-y-2', className)}>
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 shrink-0 rounded-md border border-border shadow-inner"
          style={{ backgroundColor: hex }}
          title={hex}
        />
        <Input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-10 w-14 cursor-pointer p-1"
        />
        <Input
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#1e8a8a"
          disabled={disabled}
          className="flex-1 font-mono text-sm"
        />
      </div>
    </div>
  );
}

export function ColorSwatch({ color, className }: { color?: string; className?: string }) {
  if (!color) return <span className="text-muted-foreground text-xs">—</span>;
  const hex = normalizeHex(color);
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        className="inline-block h-5 w-5 rounded border border-border"
        style={{ backgroundColor: hex }}
      />
      <span className="font-mono text-xs">{hex}</span>
    </span>
  );
}
