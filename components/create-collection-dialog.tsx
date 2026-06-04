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
import { FaRegAddressBook, FaRegAddressCard, FaRegLaugh, FaRegHeart, FaRegLightbulb, FaRegMap, FaRegUser, FaRegEnvelope, FaRegCalendarAlt, FaRegFileAlt, FaRegStar, FaRegThumbsUp, FaRegSmile, FaRegFrown, FaRegMeh, FaRegGem, FaRegFlag, FaRegTrashAlt, FaRegEdit, FaRegCheckCircle, FaRegTimesCircle } from 'react-icons/fa';
import { MdEmojiEmotions, MdEmojiObjects, MdEmojiSymbols, MdEmojiTransportation, MdEmojiFoodBeverage, MdEmojiNature, MdEmojiEvents, MdEmojiPeople } from 'react-icons/md';

interface CreateCollectionDialogProps {
  onSuccess?: (collection: Collection) => void;
}

// Collection-specific icons based on collection name
const COLLECTION_ICONS: Record<string, { value: string; label: string }> = {
  // Services and content
  'service': { value: '⚙️', label: 'Service Gear' },
  'services': { value: '⚙️', label: 'Services Gear' },
  
  // Banner
  'banner': { value: '🎨', label: 'Banner Art' },
  
  // Headings
  'headings': { value: '📝', label: 'Headings Document' },
  'all_headings': { value: '📝', label: 'All Headings' },
  
  // Contact
  'contact': { value: '✉️', label: 'Contact Mail' },
  'contactus': { value: '✉️', label: 'Contact Us' },
  
  // Footer
  'footer': { value: '📌', label: 'Footer Pin' },
  
  // Categories
  'category': { value: '📂', label: 'Category Folder' },
  'categories': { value: '📂', label: 'Categories' },
  
  // About
  'about': { value: 'ℹ️', label: 'About Info' },
  'about_us': { value: 'ℹ️', label: 'About Us' },
  
  // Articles
  'article': { value: '📚', label: 'Article Book' },
  'articles': { value: '📚', label: 'Articles' },
  
  // What We Do
  'what_we_do': { value: '🎯', label: 'What We Do Target' },
  
  // Hero Section
  'hero': { value: '🌟', label: 'Hero Star' },
  'herosec': { value: '🌟', label: 'Hero Section' },
  
  // Default
  'default': { value: '📦', label: 'Default Package' },
};

// Common fallback icons
const COMMON_ICONS = [
  { value: '📦', label: 'Package' },
  { value: '👤', label: 'Person' },
  { value: '📝', label: 'Document' },
  { value: '⚙️', label: 'Settings' },
  { value: '📊', label: 'Analytics' },
  { value: '🛒', label: 'Cart' },
  { value: '📷', label: 'Gallery' },
  { value: '🎵', label: 'Audio' },
  { value: '🎬', label: 'Video' },
  { value: '📍', label: 'Location' },
  { value: '📅', label: 'Calendar' },
  { value: '⭐', label: 'Favorite' },
  { value: '💬', label: 'Chat' },
  { value: '🔍', label: 'Search' },
  { value: '🔒', label: 'Secure' },
  { value: '💡', label: 'Idea' },
  { value: '🎯', label: 'Target' },
  { value: '📱', label: 'Mobile' },
  { value: '💻', label: 'Computer' },
  { value: '🖼️', label: 'Image' },
  // React Icons
  { value: 'FaRegAddressBook', label: 'Address Book' },
  { value: 'FaRegAddressCard', label: 'Address Card' },
  { value: 'FaRegLaugh', label: 'Laugh' },
  { value: 'FaRegHeart', label: 'Heart' },
  { value: 'FaRegLightbulb', label: 'Lightbulb' },
  { value: 'FaRegMap', label: 'Map' },
  { value: 'FaRegUser', label: 'User' },
  { value: 'FaRegEnvelope', label: 'Envelope' },
  { value: 'FaRegCalendarAlt', label: 'Calendar' },
  { value: 'FaRegFileAlt', label: 'File' },
  { value: 'FaRegStar', label: 'Star' },
  { value: 'FaRegThumbsUp', label: 'Thumbs Up' },
  { value: 'FaRegSmile', label: 'Smile' },
  { value: 'FaRegFrown', label: 'Frown' },
  { value: 'FaRegMeh', label: 'Meh' },
  { value: 'FaRegGem', label: 'Gem' },
  { value: 'FaRegFlag', label: 'Flag' },
  { value: 'FaRegTrashAlt', label: 'Trash' },
  { value: 'FaRegEdit', label: 'Edit' },
  { value: 'FaRegCheckCircle', label: 'Check Circle' },
  { value: 'FaRegTimesCircle', label: 'Times Circle' },
  { value: 'MdEmojiEmotions', label: 'Emotions' },
  { value: 'MdEmojiObjects', label: 'Objects' },
  { value: 'MdEmojiSymbols', label: 'Symbols' },
  { value: 'MdEmojiTransportation', label: 'Transportation' },
  { value: 'MdEmojiFoodBeverage', label: 'Food & Beverage' },
  { value: 'MdEmojiNature', label: 'Nature' },
  { value: 'MdEmojiEvents', label: 'Events' },
  { value: 'MdEmojiPeople', label: 'People' },
];

// Combine collection-specific icons with common icons
const ICONS = [
  ...Object.values(COLLECTION_ICONS),
  ...COMMON_ICONS,
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

  // Filter icons based on search
  const filteredIcons = ICONS.filter(icon => 
    icon.label.toLowerCase().includes(searchIcon.toLowerCase())
  );

  // Get the React Icon component
  const getIconComponent = (iconValue: string) => {
    if (iconValue.length === 1) {
      // Emoji
      return <span style={{ fontSize: '24px' }}>{iconValue}</span>;
    }
    
    // Try to find from Fa icons
    const faIcons: Record<string, any> = {
      'FaRegAddressBook': FaRegAddressBook,
      'FaRegAddressCard': FaRegAddressCard,
      'FaRegLaugh': FaRegLaugh,
      'FaRegHeart': FaRegHeart,
      'FaRegLightbulb': FaRegLightbulb,
      'FaRegMap': FaRegMap,
      'FaRegUser': FaRegUser,
      'FaRegEnvelope': FaRegEnvelope,
      'FaRegCalendarAlt': FaRegCalendarAlt,
      'FaRegFileAlt': FaRegFileAlt,
      'FaRegStar': FaRegStar,
      'FaRegThumbsUp': FaRegThumbsUp,
      'FaRegSmile': FaRegSmile,
      'FaRegFrown': FaRegFrown,
      'FaRegMeh': FaRegMeh,
      'FaRegGem': FaRegGem,
      'FaRegFlag': FaRegFlag,
      'FaRegTrashAlt': FaRegTrashAlt,
      'FaRegEdit': FaRegEdit,
      'FaRegCheckCircle': FaRegCheckCircle,
      'FaRegTimesCircle': FaRegTimesCircle,
    };
    
    // Try to find from Md icons
    const mdIcons: Record<string, any> = {
      'MdEmojiEmotions': MdEmojiEmotions,
      'MdEmojiObjects': MdEmojiObjects,
      'MdEmojiSymbols': MdEmojiSymbols,
      'MdEmojiTransportation': MdEmojiTransportation,
      'MdEmojiFoodBeverage': MdEmojiFoodBeverage,
      'MdEmojiNature': MdEmojiNature,
      'MdEmojiEvents': MdEmojiEvents,
      'MdEmojiPeople': MdEmojiPeople,
    };
    
    const Component = faIcons[iconValue] || mdIcons[iconValue];
    if (Component) {
      return <Component size={24} />;
    }
    
    return <span style={{ fontSize: '24px' }}>{iconValue}</span>;
  };

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
                <Input
                  readOnly
                  value={getIconComponent(formData.icon).props.children || formData.icon}
                  placeholder="Click to select an icon"
                  onClick={() => setShowIconDropdown(!showIconDropdown)}
                  className="cursor-pointer"
                />
                <Search 
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  onClick={() => setShowIconDropdown(!showIconDropdown)}
                />
                
                {/* Icon Dropdown */}
                {showIconDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-72 max-h-80 overflow-y-auto bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl z-50">
                    {/* Search Input in Dropdown */}
                    <div className="p-2 border-b border-gray-200 dark:border-zinc-700">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <Input
                        autoFocus
                        placeholder="Search icons..."
                        value={searchIcon}
                        onChange={(e) => setSearchIcon(e.target.value)}
                        className="pl-9 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    {/* Icons Grid */}
                    <div className="p-2 grid grid-cols-5 gap-2">
                      {filteredIcons.length > 0 ? (
                        filteredIcons.map((icon, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleIconSelect(icon.value)}
                            className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors group"
                          >
                            <div className="text-xl mb-1 group-hover:scale-110 transition-transform">
                              {getIconComponent(icon.value)}
                            </div>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 text-center line-clamp-1">
                              {icon.label}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="col-span-5 py-8 text-center text-gray-500 dark:text-gray-400">
                          No icons found
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
