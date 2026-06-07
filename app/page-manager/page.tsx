'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  GripVertical,
  Eye,
  EyeOff,
  Save,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// ── Types ──────────────────────────────────────────────────────────────────
interface PageComponent {
  id: string;
  page: string;
  key: string;
  label: string;
  order: number;
  is_active: boolean;
}

// Pages registry — add new pages here as you build them
const PAGES: Array<{ key: string; label: string; description: string }> = [
  {
    key: 'home-02',
    label: 'Home Page',
    description: 'Main landing page components',
  },
  {
    key: 'about-us',
    label: 'About Us',
    description: 'About page sections',
  },
  {
    key: 'global-presence',
    label: 'Global Presence',
    description: 'Global presence page sections',
  },
  {
    key: 'quality-certification',
    label: 'Quality Certification',
    description: 'Quality certification page sections',
  },
  // Future pages — uncomment as you add them:
  // { key: 'products',  label: 'Products',  description: 'Products page sections' },
  // { key: 'services',  label: 'Services',  description: 'Services page sections' },
  // { key: 'contact',   label: 'Contact',   description: 'Contact page sections' },
];

// ── Drag state (module-level to avoid re-renders) ──────────────────────────
let dragSrcIndex: number | null = null;

// ── Component ──────────────────────────────────────────────────────────────
export default function PageManagerPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const [activePage, setActivePage] = useState<string>(PAGES[0].key);
  const [components, setComponents] = useState<PageComponent[]>([]);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [expandedPages, setExpandedPages] = useState<Record<string, boolean>>({ 'home-02': true });

  // ── Edit label modal state ────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<PageComponent | null>(null);
  const [editLabelValue, setEditLabelValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // ── Auth guard ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  // ── Fetch components for active page ─────────────────────────────────
  const fetchComponents = useCallback(async (page: string) => {
    setFetching(true);
    setDirty(false);
    try {
      const res = await fetch(`/api/page-components?page=${page}`);
      const json = await res.json();
      if (json.success) {
        setComponents(json.data.sort((a: PageComponent, b: PageComponent) => a.order - b.order));
      }
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchComponents(activePage);
  }, [activePage, fetchComponents]);

  // ── Toggle visibility ─────────────────────────────────────────────────
  const toggleActive = (key: string) => {
    setComponents((prev) =>
      prev.map((c) => (c.key === key ? { ...c, is_active: !c.is_active } : c))
    );
    setDirty(true);
  };

  // ── Drag-and-drop reorder ─────────────────────────────────────────────
  const handleDragStart = (index: number) => {
    dragSrcIndex = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragSrcIndex === null || dragSrcIndex === index) return;

    setComponents((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragSrcIndex!, 1);
      next.splice(index, 0, moved);
      dragSrcIndex = index;
      return next.map((c, i) => ({ ...c, order: i + 1 }));
    });
    setDirty(true);
  };

  const handleDragEnd = () => {
    dragSrcIndex = null;
  };

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/page-components', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page: activePage,
          components: components.map((c) => ({
            key: c.key,
            label: c.label,
            is_active: c.is_active,
            order: c.order,
          })),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setComponents(json.data.sort((a: PageComponent, b: PageComponent) => a.order - b.order));
        setDirty(false);
        toast({ title: 'Saved', description: `${PAGES.find((p) => p.key === activePage)?.label} layout updated.` });
      } else {
        throw new Error(json.error);
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Could not save changes.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ── Sync labels from source-of-truth ─────────────────────────────────
  const handleSyncLabels = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/page-components/sync', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Labels synced', description: json.message });
        // Refresh current page components to show updated labels
        await fetchComponents(activePage);
      } else {
        throw new Error(json.error);
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Could not sync labels.', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  // ── Edit label ───────────────────────────────────────────────────────
  const openEditLabel = (comp: PageComponent) => {
    setEditTarget(comp);
    setEditLabelValue(comp.label);
    // Focus input after dialog opens
    setTimeout(() => editInputRef.current?.focus(), 80);
  };

  const confirmEditLabel = () => {
    if (!editTarget) return;
    const trimmed = editLabelValue.trim();
    if (!trimmed) return;
    setComponents((prev) =>
      prev.map((c) => (c.key === editTarget.key ? { ...c, label: trimmed } : c))
    );
    setDirty(true);
    setEditTarget(null);
  };

  // ── Render ────────────────────────────────────────────────────────────
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  const activeCount = components.filter((c) => c.is_active).length;
  const totalCount = components.length;

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-bold tracking-tight">Page Manager</h2>
          </div>
          <p className="text-muted-foreground mt-1">
            Control which sections are visible on each page. Drag to reorder, toggle to show/hide.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncLabels}
            disabled={syncing}
            className="gap-2 text-muted-foreground"
            title="Re-sync section labels from source code definitions"
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {syncing ? 'Syncing…' : 'Sync Labels'}
          </Button>
          {dirty && (
            <Button onClick={handleSave} disabled={saving} className="gap-2 shrink-0">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Page selector */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1 mb-3">
            Pages
          </p>
          {PAGES.map((page) => (
            <button
              key={page.key}
              onClick={() => {
                if (dirty) {
                  if (!confirm('You have unsaved changes. Switch page anyway?')) return;
                }
                setActivePage(page.key);
              }}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                activePage === page.key
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-accent text-foreground/70'
              )}
            >
              <span className="block font-medium">{page.label}</span>
              <span
                className={cn(
                  'block text-xs mt-0.5',
                  activePage === page.key ? 'text-primary-foreground/70' : 'text-muted-foreground'
                )}
              >
                {page.description}
              </span>
            </button>
          ))}
        </div>

        {/* Right: Component list */}
        <div className="lg:col-span-3 space-y-4">
          {/* Stats bar */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{activeCount}</span> of{' '}
                <span className="font-semibold text-foreground">{totalCount}</span> sections visible
              </span>
              {dirty && (
                <Badge variant="secondary" className="text-xs animate-pulse">
                  Unsaved changes
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Drag <GripVertical className="w-3 h-3 inline" /> to reorder
            </p>
          </div>

          {/* Component cards */}
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            {fetching ? (
              <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading components…</span>
              </div>
            ) : components.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                No components found for this page.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {components.map((comp, index) => (
                  <div
                    key={comp.key}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5 transition-all duration-150 group',
                      comp.is_active
                        ? 'bg-card hover:bg-accent/30'
                        : 'bg-muted/40 hover:bg-muted/60 opacity-60'
                    )}
                  >
                    {/* Drag handle */}
                    <div className="cursor-grab active:cursor-grabbing text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Order badge */}
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                        comp.is_active
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {index + 1}
                    </div>

                    {/* Label */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p
                          className={cn(
                            'text-sm font-medium truncate',
                            !comp.is_active && 'line-through text-muted-foreground'
                          )}
                        >
                          {comp.label}
                        </p>
                        <button
                          onClick={() => openEditLabel(comp)}
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50 hover:text-primary"
                          title="Rename this section"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{comp.key}</p>
                    </div>

                    {/* Status badge */}
                    <Badge
                      variant={comp.is_active ? 'default' : 'secondary'}
                      className={cn(
                        'text-xs shrink-0 hidden sm:flex',
                        comp.is_active ? 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20' : ''
                      )}
                    >
                      {comp.is_active ? 'Visible' : 'Hidden'}
                    </Badge>

                    {/* Toggle button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-8 w-8 shrink-0 transition-colors',
                        comp.is_active
                          ? 'text-green-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                          : 'text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30'
                      )}
                      onClick={() => toggleActive(comp.key)}
                      title={comp.is_active ? 'Hide this section' : 'Show this section'}
                    >
                      {comp.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save button (bottom) */}
          {dirty && (
            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          )}

          {/* Info box */}
          <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground/70">How it works</p>
            <p>• Toggle the eye icon to show or hide a section on the live website.</p>
            <p>• Drag the grip handle to reorder sections — the website renders them in this order.</p>
            <p>• Hidden sections leave no blank space; the layout adjusts automatically.</p>
            <p>• Click <strong>Save Changes</strong> to apply. Changes take effect on the next page load.</p>
          </div>
        </div>
      </div>

      {/* ── Edit Label Dialog ─────────────────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename Section</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="label-input">Section name</Label>
              <Input
                id="label-input"
                ref={editInputRef}
                value={editLabelValue}
                onChange={(e) => setEditLabelValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmEditLabel();
                  if (e.key === 'Escape') setEditTarget(null);
                }}
                placeholder="e.g. Why Choose Us"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Component key: <span className="font-mono">{editTarget?.key}</span>
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirmEditLabel}
              disabled={!editLabelValue.trim() || editLabelValue.trim() === editTarget?.label}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
