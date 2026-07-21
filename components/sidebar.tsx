'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Loader2, Plus, Database, ChevronRight, ChevronDown, FileText, Folder, FolderPlus, MoreVertical, Trash2, Pencil, Palette, Layout, MapPin, LayoutDashboard, File, Settings, Mail, Send, Code, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-client';
import { useSidebar } from '@/components/context/sidebar-context';
import type { Collection } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { IconRenderer } from '@/components/icon-renderer';
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
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

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
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // State for creating a new folder
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // State for delete confirmation
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  // State for renaming a folder
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<SidebarFolder | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  const { isSuperadmin, hasPermission } = useAuth();
  const { isOpen, toggle } = useSidebar();
  const { toast } = useToast();

  // Dynamically apply admin-only favicon to the browser head
  useEffect(() => {
    if (typeof window !== 'undefined' && faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [faviconUrl]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [colJson, folderJson, footerJson, settingsJson] = await Promise.all([
          fetch('/api/collections')
            .then(res => res.ok ? res.json() : { success: false })
            .catch(() => ({ success: false })),
          fetch('/api/sidebar-folders')
            .then(res => res.ok ? res.json() : { success: false })
            .catch(() => ({ success: false })),
          fetch('/api/data/footer')
            .then(res => res.ok ? res.json() : { success: false })
            .catch(() => ({ success: false })),
          fetch('/api/settings')
            .then(res => res.ok ? res.json() : { success: false })
            .catch(() => ({ success: false }))
        ]);

        if (colJson?.success) setCollections(colJson.data || []);
        if (folderJson.success) {
          setFolders(folderJson.data || []);
        }

        let logo = settingsJson?.success && settingsJson.data?.logo_url;
        let favicon = settingsJson?.success && settingsJson.data?.favicon_url;

        // Fallback to footer data
        if (!logo && footerJson.success && footerJson.data?.length > 0) {
          logo = footerJson.data[0]?.headerlogo?.[0];
        }
        if (!favicon && footerJson.success && footerJson.data?.length > 0) {
          favicon = footerJson.data[0]?.favicon?.[0];
        }

        if (logo) {
          const formattedLogo = logo.startsWith('http')
            ? logo
            : `${process.env.NEXT_PUBLIC_API_URL || ''}${logo.startsWith('/') ? '' : '/'}${logo}`;
          setLogoUrl(formattedLogo);
        }
        if (favicon) {
          const formattedFavicon = favicon.startsWith('http')
            ? favicon
            : `${process.env.NEXT_PUBLIC_API_URL || ''}${favicon.startsWith('/') ? '' : '/'}${favicon}`;
          setFaviconUrl(formattedFavicon);
        }
      } catch (err) {
        console.error('Sidebar fetch collections error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const handleRefresh = () => {
      fetchData();
    };

    window.addEventListener('sidebar:refresh', handleRefresh);
    return () => {
      window.removeEventListener('sidebar:refresh', handleRefresh);
    };
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

  const handleDeleteFolder = async (folderId: string) => {
    try {
      const res = await fetch(`/api/sidebar-folders?id=${folderId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const json = await res.json();
      if (json.success) {
        setFolders(prev => prev.filter(f => f.id !== folderId));
        setFolderToDelete(null);
        toast({ title: "Folder deleted" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Could not delete folder", variant: "destructive" });
    }
  };

  const handleRenameFolder = async () => {
    if (!folderToRename || !renameValue.trim()) return;
    try {
      const res = await fetch('/api/sidebar-folders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: folderToRename.id, name: renameValue.trim() }),
      });

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const json = await res.json();
      if (json.success) {
        setFolders(prev => prev.map(f => f.id === folderToRename.id ? { ...f, name: renameValue.trim() } : f));
        setFolderToRename(null);
        setRenameValue('');
        setIsRenameDialogOpen(false);
        toast({ title: "Folder renamed" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Could not rename folder", variant: "destructive" });
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

  const handleReorderFolders = async (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    const draggedIndex = folders.findIndex(f => f.id === draggedId);
    const targetIndex = folders.findIndex(f => f.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newFolders = [...folders];
    const [draggedItem] = newFolders.splice(draggedIndex, 1);
    newFolders.splice(targetIndex, 0, draggedItem);

    setFolders(newFolders);

    try {
      const items = newFolders.map((f, i) => ({ id: f.id, order: i }));
      const res = await fetch('/api/sidebar-folders/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error('Failed to reorder');
    } catch (err) {
      toast({ title: 'Error', description: 'Could not reorder folders', variant: 'destructive' });
    } finally {
      setDraggedFolderId(null);
      setDropTargetId(null);
    }
  };

  const handleReorderCollections = async (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;

    const draggedIndex = collections.findIndex(c => c.id === draggedId);
    const targetIndex = collections.findIndex(c => c.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const draggedItem = collections[draggedIndex];
    const targetItem = collections[targetIndex];

    // If dropped onto a collection in a different folder context, move it instead
    if ((draggedItem as any).folder_id !== (targetItem as any).folder_id) {
      handleMoveCollection(draggedId, (targetItem as any).folder_id || null);
      return;
    }

    const newCollections = [...collections];
    newCollections.splice(draggedIndex, 1);
    newCollections.splice(targetIndex, 0, draggedItem);

    setCollections(newCollections);

    try {
      // only reorder within the same scope to maintain their indices
      const scopeItems = newCollections.filter(c => (c as any).folder_id === (draggedItem as any).folder_id);
      const items = scopeItems.map((c, i) => ({ id: c.id, order: i }));

      const res = await fetch('/api/collections/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error('Failed to reorder collections');
    } catch (err) {
      toast({ title: 'Error', description: 'Could not reorder collections', variant: 'destructive' });
    } finally {
      setDraggedCollectionId(null);
      setDropTargetId(null);
    }
  };

  if (pathname.startsWith('/login')) return null;

  // Helper to render a collection item
  const renderCollectionItem = (c: Collection) => {
    const isActive = pathname === `/collections/${c.id}`;
    const isTarget = dropTargetId === `col-${c.id}`;
    const linkItem = (
      <Link
        href={`/collections/${c.id}?collectionName=${c.name}`}
        className={cn(
          'flex items-center text-foreground rounded-lg transition-all duration-200 hover:bg-accent hover:text-black py-2 px-3 gap-2 [&_svg]:text-current',
          isActive ? 'bg-primary text-primary-foreground font-medium hover:text-black' : 'text-foreground/70',
          !isOpen && 'justify-center'
        )}
      >
        {c.icon ? <IconRenderer icon={c.icon} className="w-5 h-5 flex-shrink-0" /> : <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />}
        {isOpen && <span className="truncate text-sm">{c.display_name}</span>}
      </Link>
    );

    return (
      <div
        key={c.id}
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          setDraggedCollectionId(c.id);
        }}
        onDragEnd={() => {
          setDraggedCollectionId(null);
          setDropTargetId(null);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (draggedCollectionId && draggedCollectionId !== c.id) {
            setDropTargetId(`col-${c.id}`);
          }
        }}
        onDragLeave={() => setDropTargetId(null)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (draggedCollectionId && draggedCollectionId !== c.id) {
            handleReorderCollections(draggedCollectionId, c.id);
          }
        }}
        className={cn(
          "group relative transition-all rounded-lg",
          isTarget && "border-t-primary border-t-2 bg-primary/5"
        )}
      >
        {!isOpen ? (
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              {linkItem}
            </TooltipTrigger>
            <TooltipContent side="right" className="font-semibold text-xs bg-sidebar border border-border text-foreground">
              {c.display_name}
            </TooltipContent>
          </Tooltip>
        ) : (
          linkItem
        )}
      </div>
    );
  };

  const renderSidebarLink = (
    href: string,
    label: string,
    icon: React.ReactNode,
    isActive: boolean,
    activeClass = 'bg-primary text-primary-foreground font-medium hover:text-black'
  ) => {
    const linkItem = (
      <Link
        href={href}
        className={cn(
          'flex items-center text-foreground rounded-lg transition-all duration-200 hover:bg-accent hover:text-black py-2 px-3 gap-2 [&_svg]:text-current',
          isActive ? activeClass : 'text-foreground/70',
          !isOpen && 'justify-center'
        )}
      >
        {icon}
        {isOpen && <span className="truncate text-sm">{label}</span>}
      </Link>
    );

    if (!isOpen) {
      return (
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            {linkItem}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-semibold text-xs bg-sidebar border border-border text-foreground">
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }
    return linkItem;
  };

  return (
    <TooltipProvider>
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
        <div className="flex items-center justify-between border-b border-border px-4 py-4 flex-shrink-0 h-16">
          <div className={cn('flex items-center gap-3 w-full', !isOpen && 'justify-center')}>
            {!isOpen ? (
              faviconUrl ? (
                <img
                  src={faviconUrl}
                  alt="Favicon"
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <Database className="w-4 h-4 text-primary-foreground" />
                </div>
              )
            ) : (
              logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-16 max-w-[150px] object-contain transition-all duration-300"
                />
              ) : (
                <>
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                    <Database className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider leading-none">
                      Collections
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-0.5 leading-tight">
                      Schema
                    </p>
                  </div>
                </>
              )
            )}
          </div>
        </div>

        {/* Collections List */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
     {hasPermission('dashboard') && renderSidebarLink("/dashboard", "Dashboard", <LayoutDashboard className="w-5 h-5 text-gray-500" />, pathname === '/dashboard')}
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
            <>

              {/* Render Folders First */}
              {folders.map((folder) => {
                // Hide manage-meta from folder collections (shown as static "Pages Metadata" link in SEO section)
                // Non-superadmins only see folders they have explicit permission for
                if (!isSuperadmin && !hasPermission(`folder:${folder.id}`)) return null;

                const isExpanded = !!expandedItems[folder.id];
                const isTarget = dropTargetId === folder.id;
                const folderCollections = collections.filter(c => (c as any).folder_id === folder.id && c.name !== 'manage-meta');

                if (isOpen) {
                  return (
                    <div
                      key={folder.id}
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        setDraggedFolderId(folder.id);
                      }}
                      onDragEnd={() => {
                        setDraggedFolderId(null);
                        setDropTargetId(null);
                      }}
                      className={cn(
                        "mb-1 transition-all rounded-lg border border-transparent",
                        isTarget && draggedCollectionId && "bg-primary/10 ring-2 ring-primary/30",
                        isTarget && draggedFolderId && "border-t-primary border-t-2"
                      )}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggedCollectionId || draggedFolderId) setDropTargetId(folder.id);
                      }}
                      onDragLeave={() => setDropTargetId(null)}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedCollectionId) {
                          handleMoveCollection(draggedCollectionId, folder.id);
                        } else if (draggedFolderId) {
                          handleReorderFolders(draggedFolderId, folder.id);
                        }
                      }}
                    >
                      <div
                        className="flex items-center justify-between px-3 py-2 hover:bg-accent rounded-lg cursor-pointer group"
                        onClick={() => toggleExpand(folder.id)}
                      >
                        <span className="flex items-center gap-2 text-foreground/80 font-semibold text-xs uppercase tracking-wider">
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          <Folder className="w-3.5 h-3.5 fill-current text-gray-500" />
                          <span>{folder.name}</span>
                        </span>
                        {isSuperadmin && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFolderToRename(folder);
                                setRenameValue(folder.name);
                                setIsRenameDialogOpen(true);
                              }}
                              className="p-1 hover:bg-accent hover:text-foreground rounded transition-all"
                              title="Rename folder"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFolderToDelete(folder.id);
                              }}
                              className="p-1 hover:bg-destructive hover:text-destructive-foreground rounded transition-all"
                              title="Delete folder"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      {isExpanded && (
                        <div className="ml-4 space-y-1 mt-1 border-l border-border/60 pl-2">
                          {folderCollections.map(renderCollectionItem)}
                          {folder.name.toLowerCase() === 'global presence' && hasPermission('global-presence') && (
                            <Link
                              href="/global-presence"
                              className={cn(
                                'flex items-center text-foreground rounded-lg transition-all duration-200 hover:bg-accent hover:text-black py-2 px-3 gap-2',
                                pathname === '/global-presence' ? 'bg-primary text-primary-foreground font-medium hover:text-black' : 'text-foreground/70'
                              )}
                            >
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="truncate text-sm">Global Presence</span>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={folder.id}
                      className="mb-1 flex justify-center"
                    >
                      <HoverCard openDelay={100} closeDelay={150}>
                        <HoverCardTrigger asChild>
                          <div
                            className="flex items-center justify-center p-2 hover:bg-accent rounded-lg cursor-pointer group"
                          >
                            <Folder className="w-5 h-5 fill-current text-gray-500" />
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent side="right" align="start" className="w-56 p-2 bg-sidebar border border-border shadow-lg space-y-1 text-foreground">
                          <div className="px-2 py-1 text-xs font-semibold text-foreground/50 uppercase tracking-wider border-b border-border/50 mb-1">
                            {folder.name}
                          </div>
                          {folderCollections.map((c) => {
                            const isActive = pathname === `/collections/${c.id}`;
                            return (
                              <Link
                                key={c.id}
                                href={`/collections/${c.id}?collectionName=${c.name}`}
                                className={cn(
                                  'flex items-center text-foreground rounded-lg transition-all duration-200 hover:bg-accent hover:text-black py-1.5 px-2 gap-2 text-sm',
                                  isActive ? 'bg-primary text-primary-foreground font-medium hover:text-black' : 'text-foreground/70'
                                )}
                              >
                                {c.icon ? <IconRenderer icon={c.icon} className="w-4 h-4" /> : <FileText className="w-4 h-4 text-gray-500" />}
                                <span className="truncate">{c.display_name}</span>
                              </Link>
                            );
                          })}
                          {folder.name.toLowerCase() === 'global presence' && hasPermission('global-presence') && (
                            <Link
                              href="/global-presence"
                              className={cn(
                                'flex items-center text-foreground rounded-lg transition-all duration-200 hover:bg-accent hover:text-black py-1.5 px-2 gap-2 text-sm',
                                pathname === '/global-presence' ? 'bg-primary text-primary-foreground font-medium hover:text-black' : 'text-foreground/70'
                              )}
                            >
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="truncate">Global Presence</span>
                            </Link>
                          )}
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                  );
                }
              })}

              <div
                className={cn(
                  "space-y-1 pb-2 transition-all min-h-[20px]",
                  dropTargetId === 'root' && draggedCollectionId && "bg-primary/10 ring-2 ring-primary/30 rounded-lg"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggedCollectionId) setDropTargetId('root');
                }}
                onDragLeave={() => setDropTargetId(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedCollectionId) {
                    handleMoveCollection(draggedCollectionId, null);
                  }
                }}
              >
                {collections.filter(c => !(c as any).folder_id && c.name !== 'manage-meta').map(renderCollectionItem)}
              </div>
            </>
          )}

          {/* Static Links */}
          <div className=" border-t border-border/50 space-y-1">
       
            {hasPermission('color-manager') && renderSidebarLink("/color-manager", "Color Manager", <IconRenderer icon="ph:palette-fill" className="w-6 h-6 text-gray-500" />, pathname === '/color-manager', 'bg-primary text-black font-medium')}
            {hasPermission('page-manager') && renderSidebarLink("/page-manager", "Page Manager", <IconRenderer icon="ph:file-text-fill" className="w-6 h-6 text-gray-500" />, pathname === '/page-manager')}
            {hasPermission('global-presence') && renderSidebarLink("/global-presence", "Global Presence", <IconRenderer icon="ph:map-pin-fill" className="w-6 h-6 text-gray-500" />, pathname === '/global-presence')}
            {hasPermission('calendar') && renderSidebarLink("/calendar", "Calendar", <IconRenderer icon="lucide:calendar" className="w-6 h-6 text-gray-500" />, pathname === '/calendar')}
            {hasPermission('api-docs') && renderSidebarLink("/api-docs", "API Docs", <Code className="w-5 h-5 text-gray-500" />, pathname === '/api-docs')}
            {/* Configuration Section — only show heading if user has access to at least one item */}
            {(hasPermission('email-templates') || hasPermission('send-email') || hasPermission('settings') || isSuperadmin) && (
              <div className="pt-2 pb-1">
                <p className={cn("px-3 text-xs font-semibold text-foreground/50 uppercase tracking-wider", !isOpen && "text-center")}>
                  {isOpen ? 'Configuration' : 'Cfg'}
                </p>
              </div>
            )}
            {hasPermission('email-templates') && renderSidebarLink("/email-templates", "Email Templates", <IconRenderer icon="ph:envelope-simple-fill" className="w-6 h-6 text-gray-500" />, pathname === '/email-templates')}
            {hasPermission('send-email') && renderSidebarLink("/send-email", "Send Email", <IconRenderer icon="ph:paper-plane-right-fill" className="w-6 h-6 text-gray-500" />, pathname === '/send-email')}
            {hasPermission('settings') && renderSidebarLink("/settings", "Global Settings", <IconRenderer icon="ph:gear-fill" className="w-6 h-6 text-gray-500" />, pathname === '/settings')}
            {isSuperadmin && renderSidebarLink("/role-manager", "Role Manager", <Shield className="w-5 h-5 text-gray-500" />, pathname === '/role-manager')}
            {isSuperadmin && renderSidebarLink("/user-management", "User Manager", <Users className="w-5 h-5 text-gray-500" />, pathname === '/user-management')}

            {/* SEO Section — only show heading if user has access to at least one SEO item */}
            {(hasPermission('seo-settings') || hasPermission('pages-metadata') || hasPermission('seo-audit') || hasPermission('redirects')) && (
              <div className="pt-2 pb-1 border-t border-border/50">
                <p className={cn("px-3 text-xs font-semibold text-foreground/50 uppercase tracking-wider", !isOpen && "text-center")}>
                  {isOpen ? 'SEO Management' : 'SEO'}
                </p>
              </div>
            )}
            {hasPermission('seo-settings') && renderSidebarLink("/seo/settings", "SEO Settings", <IconRenderer icon="ph:globe-bold" className="w-6 h-6 text-gray-500" />, pathname.startsWith('/seo/settings'))}
            {hasPermission('pages-metadata') && renderSidebarLink("/collections/6a2cd928c7ccfc7bea1e0099?collectionName=manage-meta", "Pages Metadata", <IconRenderer icon="ph:files-bold" className="w-6 h-6 text-gray-500" />, pathname.includes('6a2cd928c7ccfc7bea1e0099'))}
            {hasPermission('seo-audit') && renderSidebarLink("/seo/audit", "SEO Audit", <IconRenderer icon="ph:shield-check-bold" className="w-6 h-6 text-gray-500" />, pathname.startsWith('/seo/audit'))}
            {hasPermission('redirects') && renderSidebarLink("/seo/redirects", "Redirects", <IconRenderer icon="ph:arrows-merge-bold" className="w-6 h-6 text-gray-500" />, pathname.startsWith('/seo/redirects'))}
          </div>
        </div>

        {/* Add Button */}
        {isSuperadmin && (
          <div className="border-t border-border px-3 py-3 flex-shrink-0 space-y-2">
            <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
              {!isOpen ? (
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground hover:text-primary justify-center"
                      >
                        <FolderPlus className="w-4 h-4 " />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-semibold text-xs bg-sidebar border border-border text-foreground">
                    Add Section
                  </TooltipContent>
                </Tooltip>
              ) : (
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground hover:text-primary justify-start gap-2"
                  >
                    <FolderPlus className="w-4 h-4 " />
                    <span className="text-xs">Add Section</span>
                  </Button>
                </DialogTrigger>
              )}
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

            <Link href="/collections">
              {!isOpen ? (
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-full justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-semibold text-xs bg-sidebar border border-border text-foreground">
                    New Collection
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="outline"
                  size="icon"
                  className="w-full justify-start gap-2 px-3"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">New Collection</span>
                </Button>
              )}
            </Link>
          </div>
        )}

        {/* Delete Folder Confirmation Dialog */}
        <Dialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Folder</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-foreground/70">
                Are you sure you want to delete this folder? This action cannot be undone.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFolderToDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => folderToDelete && handleDeleteFolder(folderToDelete)}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Folder Dialog */}
        <Dialog open={isRenameDialogOpen} onOpenChange={(open) => !open && setIsRenameDialogOpen(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Folder</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label>Folder Name</Label>
                <Input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  placeholder="e.g. About Us"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRenameFolder();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRenameFolder}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </aside>
    </TooltipProvider>
  );
}
