'use client';

import React from "react"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Collection } from '@/lib/types';
import { IconRenderer } from '@/components/icon-renderer';
import { useEffect } from 'react';

// Default initial icons to show before searching
const DEFAULT_ICONS = [
  { value: 'lucide:package', label: 'Package' },
  { value: 'lucide:user', label: 'User' },
  { value: 'lucide:file-text', label: 'Document' },
  { value: 'lucide:settings', label: 'Settings' },
  { value: 'lucide:bar-chart', label: 'Analytics' },
  { value: 'lucide:shopping-cart', label: 'Cart' },
  { value: 'lucide:image', label: 'Image' },
  { value: 'lucide:music', label: 'Audio' },
  { value: 'lucide:video', label: 'Video' },
  { value: 'lucide:map-pin', label: 'Location' },
  { value: 'lucide:calendar', label: 'Calendar' },
  { value: 'lucide:star', label: 'Star' },
  { value: 'lucide:message-square', label: 'Chat' },
  { value: 'lucide:search', label: 'Search' },
  { value: 'lucide:lock', label: 'Secure' },
  { value: 'lucide:lightbulb', label: 'Idea' },
  { value: 'lucide:target', label: 'Target' },
  { value: 'lucide:smartphone', label: 'Mobile' },
  { value: 'lucide:monitor', label: 'Computer' },
];

export function CreateCollectionDialog({ onSuccess }: CreateCollectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchIcon, setSearchIcon] = useState('');
  const [showIconDropdown, setShowIconDropdown] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    icon: '📦',
    color: '#3B82F6',
  });
  const { toast } = useToast();

  const [iconSearchResults, setIconSearchResults] = useState<{value: string, label: string}[]>(DEFAULT_ICONS);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!searchIcon || searchIcon.length < 2) {
      setIconSearchResults(DEFAULT_ICONS);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(searchIcon)}&limit=30`);
        const data = await res.json();
        if (data && data.icons) {
          setIconSearchResults(data.icons.map((icon: string) => ({
            value: icon,
            label: icon.split(':').pop() || icon
          })));
        }
      } catch (e) {
         console.error('Failed to search icons', e);
      } finally {
        setSearchLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchIcon]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create collection');
      }

      toast({
        title: 'Success',
        description: 'Collection created successfully',
      });

      setFormData({
        name: '',
        display_name: '',
        description: '',
        icon: '📦',
        color: '#3B82F6',
      });
      setOpen(false);
      setSearchIcon('');
      setShowIconDropdown(false);

      // Trigger sidebar to refresh
      window.dispatchEvent(new Event('sidebar:refresh'));

      if (onSuccess && result.data) {
        onSuccess(result.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create collection',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const handleIconSelect = (icon: string) => {
    setFormData({ ...formData, icon });
    setShowIconDropdown(false);
    setSearchIcon('');
  };

  const handleColorChange = (color: string) => {
    setFormData({ ...formData, color });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          New Collection
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Collection</DialogTitle>
          <DialogDescription>
            Create a new collection to organize your data schema
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Collection Name</Label>
            <Input
              id="name"
              placeholder="e.g., users, products, posts"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              Use lowercase letters, numbers, and underscores
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              placeholder="e.g., Users, Products, Posts"
              value={formData.display_name}
              onChange={(e) =>
                setFormData({ ...formData, display_name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what this collection stores..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Icon & Color</Label>
            
            {/* Icon Selector */}
            <div className="relative">
              <Label className="block mb-2 text-sm">Select Icon</Label>
              <div className="relative">
                <div 
                  className="flex items-center gap-2 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer"
                  onClick={() => setShowIconDropdown(!showIconDropdown)}
                >
                  <IconRenderer icon={formData.icon} className="w-5 h-5" />
                  <span className="truncate text-muted-foreground">{formData.icon}</span>
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                
                {/* Icon Dropdown */}
                {showIconDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-72 max-h-80 overflow-y-auto bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl z-50">
                    {/* Search Input in Dropdown */}
                    <div className="p-2 border-b border-gray-200 dark:border-zinc-700">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <Input
                        autoFocus
                        placeholder="Search icons... (e.g. user, home)"
                        value={searchIcon}
                        onChange={(e) => setSearchIcon(e.target.value)}
                        className="pl-9 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    {/* Icons Grid */}
                    <div className="p-2 grid grid-cols-5 gap-2">
                      {searchLoading ? (
                        <div className="col-span-5 py-8 text-center text-gray-500 flex flex-col items-center">
                          <span className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-2" />
                          <span className="text-xs">Searching API...</span>
                        </div>
                      ) : iconSearchResults.length > 0 ? (
                        iconSearchResults.map((icon, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleIconSelect(icon.value)}
                            className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors group"
                            title={icon.value}
                          >
                            <div className="text-xl mb-1 group-hover:scale-110 transition-transform">
                              <IconRenderer icon={icon.value} />
                            </div>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center line-clamp-1 w-full overflow-hidden text-ellipsis">
                              {icon.label}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="col-span-5 py-8 text-center text-gray-500 dark:text-gray-400 text-xs">
                          No icons found. Try different keywords.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label htmlFor="color">Collection Color</Label>
              <div className="flex gap-2 items-center">
                <div className="relative">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer rounded-md"
                    title="Select a color"
                  />
                  <div className="absolute -bottom-6 left-0 text-[10px] text-gray-500">
                    {formData.color}
                  </div>
                </div>
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="flex-1 font-mono text-sm"
                  placeholder="#3B82F6"
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#64748B', '#D4AF37'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorChange(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setSearchIcon('');
                setShowIconDropdown(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Creating…
                </span>
              ) : 'Create Collection'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
