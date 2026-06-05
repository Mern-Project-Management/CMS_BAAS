'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { FilePreview } from './file-preview';
import type { Field } from '@/lib/types';

type Props = {
  field: Field;
  value?: string;
  onChange: (url: string) => void;
  required?: boolean;
};

export function FileUpload({ field, value, onChange, required }: Props) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);

  // Update preview when value prop changes (for edit mode)
  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  // Initialize preview from value prop on first mount (for edit mode)
  useEffect(() => {
    if (value && !initializedRef.current) {
      initializedRef.current = true;
      setPreview(value);
      onChange(value);
    }
  }, []);

  const isImage = field.field_type === 'Image';
  const acceptedTypes = isImage
    ? 'image/*'
    : 'image/*,application/pdf,video/*,audio/*,application/msword,application/vnd.openxmlformats-officedocument.*,text/*,application/zip,application/x-rar-compressed';

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fieldType', field.field_type);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Upload failed');
      }

      const url = json.data.url;
      setPreview(url);
      onChange(url);
      toast({ title: 'File uploaded successfully' });
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err instanceof Error ? err.message : 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function handleRemove() {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="border rounded-lg p-4 space-y-2">
          <FilePreview url={preview} fieldType={field.field_type} className="mb-2" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            Remove File
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            onChange={handleFileSelect}
            className="hidden"
            id={`file-${field.id}`}
            required={required && !preview}
          />
          <label
            htmlFor={`file-${field.id}`}
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <span className="text-sm text-primary/70 font-medium">Uploading…</span>
              </>
            ) : (
              <>
                {isImage ? (
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                ) : (
                  <Upload className="w-8 h-8 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">
                  Click to upload {isImage ? 'image' : 'file'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isImage
                    ? 'PNG, JPG, GIF, WEBP up to 10MB'
                    : 'PDF, Images, Videos, Documents up to 50MB'}
                </span>
              </>
            )}
          </label>
        </div>
      )}
    </div>
  );
}
