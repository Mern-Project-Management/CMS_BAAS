'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Loader2, Plus, Database, ChevronRight, ChevronDown, FileText, Folder, FolderPlus, MoreVertical, Trash2, Palette, Layout, MapPin, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-client';
import { useSidebar } from '@/components/context/sidebar-context';
import type { Collection } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SidebarFolder {
  id: string;
  name: string;
  icon?: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [folders, setFolders] = useState<SidebarFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [draggedCollectionId, setDraggedCollectionId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  
  // State for creating a new folder
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const { isSuperadmin } = useAuth();
  const { isOpen, toggle } = useSidebar();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [colJson, folderJson] = await Promise.all([
          fetch('/api/collections')
            .then(res => res.ok ? res.json() : { success: false })
            .catch(() => ({ success: false })),
          fetch('/api/sidebar-folders')
            .then(res => res.ok ? res.json() : { success: false })
            .catch(() => ({ success: false }))
        ]);

        if (colJson?.success) setCollections(colJson.data || []);
        if (folderJson.success) {
          setFolders(folderJson.data || []);
        } else {
          // Fallback/Mock for testing if API doesn't exist yet
          // setFolders([{ id: '1', name: 'About Us' }, { id: '2', name: 'Home Components' }]);
        }
      } catch (err) {
        console.error('Sidebar fetch collections error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await fetch('/api/sidebar-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      
      const json = await res.json();
      if (json.success) {
        setFolders(prev => [...prev, json.data]);
        setNewFolderName('');
        setIsFolderDialogOpen(false);
        toast({ title: "Folder created" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Could not create folder", variant: "destructive" });
    }
  };

  const handleMoveCollection = async (collectionId: string, folderId: string | null) => {
    if (collectionId === folderId) return;

    try {
      const res = await fetch(`/api/collections/${collectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: folderId }),
      });

      const json = await res.json();
      if (json.success) {
        setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, folder_id: folderId } : c));
        toast({ title: 'Organized', description: 'Collection moved.' });
      } else {
        throw new Error(json.error || 'Failed to move collection');
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Could not move collection', variant: 'destructive' });
    } finally {
      setDraggedCollectionId(null);
      setDropTargetId(null);
    }
  };

  if (pathname.startsWith('/login')) return null;

  // Helper to render a collection item
  const renderCollectionItem = (c: Collection) => {
    const isActive = pathname === `/collections/${c.id}`;
    return (
      <div 
        key={c.id}
        draggable
        onDragStart={() => setDraggedCollectionId(c.id)}
        className="group relative"
      >
        <Link
          href={`/collections/${c.id}?collectionName=${c.name}`}
          className={cn(
            'flex items-center text-foreground rounded-lg transition-all duration-200 hover:bg-accent py-2 px-3 gap-2',
            isActive ? 'bg-primary text-primary-foreground font-medium' : 'text-foreground/70'
          )}
        >
          {c.icon || <FileText className="w-4 h-4 opacity-60" />}
          {isOpen && <span className="truncate text-sm">{c.display_name}</span>}
        </Link>
      </div>
    );
  };

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={toggle}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out md:relative md:h-screen',
          isOpen ? 'translate-x-0 w-full md:w-64' : '-translate-x-full md:translate-x-0 w-0 md:w-20'
        )}
      >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-4 flex-shrink-0">
        <div className={cn('flex items-center gap-3', !isOpen && 'justify-center')}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Database className="w-4 h-4 text-primary-foreground" />
          </div>
          {isOpen && (
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider leading-none">
                Collections
              </p>
              <p className="text-sm font-semibold text-foreground mt-0.5 leading-tight">
                Schema
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Collections List */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {loading ? (
          <div className={cn('flex items-center gap-2.5 px-3 py-2.5 text-sm text-primary/70', !isOpen && 'justify-center')}>
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            {isOpen && <span className="font-medium">Loading...</span>}
          </div>
        ) : collections.length === 0 ? (
          <div className={cn('px-3 py-2.5 text-sm text-foreground/50 font-medium', !isOpen && 'text-center')}>
            {isOpen ? 'No collections yet.' : '-'}
          </div>
        ) : (
          <nav className="space-y-1">
            {isOpen && (
              <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase mb-2 mt-1">
                Website colors
              </p>
            )}
            <Link
              href="/site-theme"
              className={cn(
                'flex items-center rounded-lg transition-all duration-200 hover:bg-accent py-2 px-3 gap-2',
                pathname === '/site-theme'
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-foreground/70',
              )}
            >
              <Palette className="w-4 h-4 opacity-80" />
              {isOpen && <span className="truncate text-sm">Site theme</span>}
            </Link>
            <Link
              href="/section-styles"
              className={cn(
                'flex items-center rounded-lg transition-all duration-200 hover:bg-accent py-2 px-3 gap-2 mb-3',
                pathname === '/section-styles'
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-foreground/70',
              )}
            >
              <Layout className="w-4 h-4 opacity-80" />
              {isOpen && <span className="truncate text-sm">Section styles</span>}
            </Link>
            <Link
              href="/global-presence"
              className={cn(
                'flex items-center rounded-lg transition-all duration-200 hover:bg-accent py-2 px-3 gap-2',
                pathname === '/global-presence'
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-foreground/70',
              )}
            >
              <MapPin className="w-4 h-4 opacity-80" />
              {isOpen && <span className="truncate text-sm">Global Presence</span>}
            </Link>
            <Link
              href="/page-manager"
              className={cn(
                'flex items-center rounded-lg transition-all duration-200 hover:bg-accent py-2 px-3 gap-2 mb-3',
                pathname === '/page-manager'
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-foreground/70',
              )}
            >
              <LayoutDashboard className="w-4 h-4 opacity-80" />
              {isOpen && <span className="truncate text-sm">Page Manager</span>}
            </Link>

            {/* Render Folders */}
            {folders.map((folder) => {
              const isExpanded = !!expandedItems[folder.id];
              const isTarget = dropTargetId === folder.id;
              const folderCollections = collections.filter(c => (c as any).folder_id === folder.id);

              return (
                <div
                  key={folder.id}
                  className={cn(
                    "mb-1 transition-all rounded-lg",
                    isTarget && "bg-primary/10 ring-2 ring-primary/30"
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggedCollectionId) setDropTargetId(folder.id);
                  }}
                  onDragLeave={() => setDropTargetId(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedCollectionId) handleMoveCollection(draggedCollectionId, folder.id);
                  }}
                >
                  <div 
                    className="flex items-center justify-between px-3 py-2 hover:bg-accent rounded-lg cursor-pointer group"
                    onClick={() => toggleExpand(folder.id)}
                  >
                    <span className="flex items-center gap-2 text-foreground/80 font-semibold text-xs uppercase tracking-wider">
                      {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      <Folder className="w-3.5 h-3.5 fill-current opacity-60" />
                      {isOpen && <span>{folder.name}</span>}
                    </span>
                  </div>
                  {isExpanded && isOpen && (
                    <div className="ml-4 space-y-1 mt-1 border-l border-border/60 pl-2">
                      {folderCollections.map(renderCollectionItem)}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Render Root Collections (Uncategorized) */}
            <div 
              className={cn("mt-4 pt-4 border-t border-border/40", dropTargetId === 'root' && "bg-primary/5")}
              onDragOver={(e) => {
                e.preventDefault();
                setDropTargetId('root');
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedCollectionId) handleMoveCollection(draggedCollectionId, null);
              }}
            >
              {isOpen && <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase mb-2">Uncategorized</p>}
              {collections.filter(c => !(c as any).folder_id).map(renderCollectionItem)}
            </div>
          </nav>
        )}
      </div>

      {/* Add Button */}
      {isSuperadmin && (
        <div className="border-t border-border px-3 py-3 flex-shrink-0 space-y-2">
          <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn('w-full text-muted-foreground hover:text-primary', isOpen ? 'justify-start gap-2' : 'justify-center')}
              >
                <FolderPlus className="w-4 h-4" />
                {isOpen && <span className="text-xs">Add Section</span>}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Sidebar Section</DialogTitle></DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label>Section Name</Label>
                  <Input 
                    value={newFolderName} 
                    onChange={(e) => setNewFolderName(e.target.value)} 
                    placeholder="e.g. About Us" 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateFolder}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Link href="/">
            <Button
              variant="outline"
              size="icon"
              className={cn('w-full', isOpen ? 'justify-start gap-2' : 'justify-center')}
              title={!isOpen ? 'Create New' : undefined}
            >
              <Plus className="w-4 h-4" />
              {isOpen && <span className="text-sm font-medium">New Collection</span>}
            </Button>
          </Link>
        </div>
      )}
    </aside>
    </>
  );
}
