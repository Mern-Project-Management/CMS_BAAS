'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Collection } from '@/lib/types';

import { IconRenderer } from '@/components/icon-renderer';

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

interface EditCollectionDialogProps {
  collection: Collection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (collection: Collection) => void;
}

export function EditCollectionDialog({
  collection,
  open,
  onOpenChange,
  onSuccess,
}: EditCollectionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [searchIcon, setSearchIcon] = useState('');
  const [showIconDropdown, setShowIconDropdown] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    icon: '📦',
  });

  const { toast } = useToast();

  const [iconSearchResults, setIconSearchResults] = useState<{value: string, label: string}[]>(DEFAULT_ICONS);
  const [searchLoading, setSearchLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowIconDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Populate form when collection changes
  useEffect(() => {
    if (collection && open) {
      setFormData({
        name: collection.name ?? '',
        display_name: collection.display_name ?? '',
        description: collection.description ?? '',
        icon: collection.icon || '📦',
      });
      setSearchIcon('');
      setShowIconDropdown(false);
    }
  }, [collection, open]);

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
    if (!collection) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: formData.display_name,
          description: formData.description,
          icon: formData.icon,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update collection');
      }

      toast({ title: 'Success', description: 'Collection updated successfully' });
      onOpenChange(false);
      if (onSuccess && result.data) onSuccess(result.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update collection',
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle> </DialogTitle>
          <DialogDescription>
            Update collection details and icon.
          </DialogDescription>
        </DialogHeader>

        {collection && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Collection Name</Label>
                  <Input
                    id="edit-name"
                    placeholder="e.g., users, products, posts"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use lowercase letters, numbers, and underscores
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-display_name">Display Name</Label>
                  <Input
                    id="edit-display_name"
                    placeholder="e.g., Users, Products, Posts"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Icon Selector */}
                <div className="space-y-2">
                  <Label>Select Icon</Label>
                  <div className="relative" ref={dropdownRef}>
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
                      <div className="absolute bottom-full left-0 mb-2 w-full max-h-80 overflow-y-auto bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl z-50">
                        <div className="p-2 border-b relative">
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
                            <div className="col-span-5 py-8 text-center text-gray-500 text-xs">No icons found. Try different keywords.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Full Width Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description (optional)</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe what this collection stores..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Saving…
                  </span>
                ) : 'Save Changes'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
