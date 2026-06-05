'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ImagePlus, X, Images } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  value?: string[];
  onChange: (urls: string[]) => void;
  required?: boolean;
  maxImages?: number;
};

export function MultiImageUpload({ value = [], onChange, required, maxImages = 20 }: Props) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update images when value prop changes (for edit mode)
  useEffect(() => {
    const imgArray = Array.isArray(value) ? value.filter(Boolean) : [];
    setImages(imgArray);
  }, [value]);

  const canAddMore = images.length < maxImages;
  const remaining = maxImages - images.length;

  async function uploadFile(file: File): Promise<string | null> {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: `"${file.name}" is not an image.`,
        variant: 'destructive',
      });
      return null;
    }

    const form = new FormData();
    form.append('file', file);
    form.append('fieldType', 'image');

    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Upload failed');
    return json.data.url as string;
  }

  async function handleFiles(files: FileList | File[]) {
    const fileArr = Array.from(files).slice(0, remaining);
    if (fileArr.length === 0) return;

    setUploading(true);
    setUploadProgress({ done: 0, total: fileArr.length });

    const results: string[] = [];
    for (const file of fileArr) {
      try {
        const url = await uploadFile(file);
        if (url) results.push(url);
      } catch (err) {
        toast({
          title: 'Upload failed',
          description: err instanceof Error ? err.message : `Failed: ${file.name}`,
          variant: 'destructive',
        });
      }
      setUploadProgress((p) => p ? { ...p, done: p.done + 1 } : null);
    }

    if (results.length > 0) {
      const newImages = [...images, ...results];
      setImages(newImages);
      onChange(newImages);
      toast({ title: `${results.length} image${results.length > 1 ? 's' : ''} uploaded` });
    }

    setUploading(false);
    setUploadProgress(null);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }

  function removeImage(index: number) {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onChange(newImages);
  }

  function moveImage(from: number, to: number) {
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setImages(next);
    onChange(next);
  }

  return (
    <div className="space-y-4">

      {/* ── Upload button row ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); if (canAddMore) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col sm:flex-row items-center gap-3 rounded-xl border-2 border-dashed px-5 py-4 transition-colors',
          dragOver && canAddMore
            ? 'border-primary bg-primary/10'
            : canAddMore
              ? 'border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/8'
              : 'border-border/40 bg-muted/20 opacity-60'
        )}
      >
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Images className="w-5 h-5 text-primary" />
        </div>

        {/* Text */}
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm font-medium text-foreground">
            {images.length === 0 ? 'No images added yet' : `${images.length} image${images.length > 1 ? 's' : ''} added`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {canAddMore
              ? `PNG, JPG, WEBP, GIF · up to ${remaining} more · drag & drop or click button`
              : `Maximum ${maxImages} images reached`}
          </p>
        </div>

        {/* Button */}
        <Button
          type="button"
          variant="default"
          size="sm"
          disabled={!canAddMore || uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 gap-2 min-w-[140px]"
        >
          {uploading ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              {uploadProgress
                ? `${uploadProgress.done} / ${uploadProgress.total}`
                : 'Uploading…'}
            </>
          ) : (
            <>
              <ImagePlus className="w-4 h-4" />
              {images.length === 0 ? 'Upload Images' : 'Add More Images'}
            </>
          )}
        </Button>
      </div>

      {/* ── Image grid ── */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {images.map((url, idx) => (
            <div
              key={url + idx}
              className="group relative aspect-square rounded-lg overflow-hidden border border-border/60 bg-muted/20 shadow-sm"
            >
              {/* Thumbnail */}
              <img
                src={url}
                alt={`Image ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 cursor-pointer"
                onClick={() => window.open(url, '_blank')}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24'%3E%3Cpath fill='%23ccc' d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/%3E%3C/svg%3E";
                }}
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200" />

              {/* Top-right: remove button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/80"
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Bottom: reorder arrows + index */}
              <div className="absolute bottom-1 inset-x-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-0.5">
                  {idx > 0 && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveImage(idx, idx - 1); }}
                      className="w-5 h-5 rounded bg-white/80 hover:bg-white text-foreground flex items-center justify-center text-xs font-bold shadow"
                      title="Move left"
                    >
                      ‹
                    </button>
                  )}
                  {idx < images.length - 1 && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveImage(idx, idx + 1); }}
                      className="w-5 h-5 rounded bg-white/80 hover:bg-white text-foreground flex items-center justify-center text-xs font-bold shadow"
                      title="Move right"
                    >
                      ›
                    </button>
                  )}
                </div>
                <span className="text-[10px] font-semibold bg-black/60 text-white rounded px-1 leading-4">
                  {idx + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleInputChange}
        required={required && images.length === 0}
      />
    </div>
  );
}
