'use client';

import { useCallback, useEffect, useState } from 'react';
import { Layout, Loader2, Plus, RefreshCw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorField } from '@/components/color-field';
import { useToast } from '@/hooks/use-toast';
import {
  SECTION_STYLES_COLLECTION,
  SECTION_STYLE_COLOR_FIELDS,
} from '@/lib/theme-schema';

type SectionRow = {
  id: string;
  section_id?: string;
  page_slug?: string;
  background_color?: string;
  text_color?: string;
  heading_color?: string;
  primary_color?: string;
  hover_background_color?: string;
  hover_text_color?: string;
  is_active?: boolean;
};

const emptyDraft = (): Omit<SectionRow, 'id'> => ({
  section_id: '',
  page_slug: 'home',
  background_color: '#ffffff',
  text_color: '#364e52',
  heading_color: '#0c1e21',
  primary_color: '#1e8a8a',
  hover_background_color: '#1e8a8a',
  hover_text_color: '#ffffff',
  is_active: true,
});

function SectionPreviewCard({ row }: { row: SectionRow }) {
  const hoverBg = row.hover_background_color || row.primary_color || '#1e8a8a';
  const hoverText = row.hover_text_color || '#ffffff';

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
        Hover the card to preview
      </p>
      <div
        className="rounded-lg border border-border/80 p-4 min-h-[100px] transition-colors duration-300 cursor-default"
        style={{
          backgroundColor: row.background_color || '#fff',
          color: row.text_color || '#364e52',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = hoverBg;
          e.currentTarget.style.color = hoverText;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = row.background_color || '#fff';
          e.currentTarget.style.color = row.text_color || '#364e52';
        }}
      >
        <p className="text-[10px] uppercase tracking-wider opacity-70">
          {row.page_slug || 'all pages'} · {row.section_id}
        </p>
        <p
          className="text-lg font-semibold mt-1"
          style={{ color: 'inherit' }}
        >
          Feature card (hover)
        </p>
        <p className="text-sm mt-1 opacity-90">Matches .choose-box:hover on site</p>
      </div>
    </div>
  );
}

export function SectionStylesEditor() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SectionRow[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());
  const [initializing, setInitializing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/data/${SECTION_STYLES_COLLECTION}?limit=200`);
      const json = await res.json();
      if (!json.success) {
        setRows([]);
        return;
      }
      setRows(Array.isArray(json.data) ? json.data : []);
    } catch {
      toast({ title: 'Error', description: 'Could not load section styles', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleInitialize() {
    setInitializing(true);
    try {
      const res = await fetch('/api/theme/ensure', { method: 'POST' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Initialize failed');
      toast({ title: 'Ready', description: 'Section styles collection ready.' });
      await load();
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Could not initialize',
        variant: 'destructive',
      });
    } finally {
      setInitializing(false);
    }
  }

  function updateRow(id: string, patch: Partial<SectionRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function saveRow(row: SectionRow) {
    setSavingId(row.id);
    try {
      const body = {
        section_id: row.section_id,
        page_slug: row.page_slug || '',
        background_color: row.background_color,
        text_color: row.text_color,
        heading_color: row.heading_color,
        primary_color: row.primary_color,
        hover_background_color: row.hover_background_color,
        hover_text_color: row.hover_text_color,
        is_active: row.is_active !== false,
      };
      const res = await fetch(`/api/data/${SECTION_STYLES_COLLECTION}/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Save failed');
      toast({ title: 'Saved', description: `Updated ${row.section_id}` });
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Save failed',
        variant: 'destructive',
      });
    } finally {
      setSavingId(null);
    }
  }

  async function createRow() {
    if (!draft.section_id?.trim()) {
      toast({ title: 'Section ID required', variant: 'destructive' });
      return;
    }
    setSavingId('new');
    try {
      const res = await fetch(`/api/data/${SECTION_STYLES_COLLECTION}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          section_id: draft.section_id.trim(),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Create failed');
      toast({ title: 'Created', description: draft.section_id });
      setShowNew(false);
      setDraft(emptyDraft());
      await load();
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Create failed',
        variant: 'destructive',
      });
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading section styles…
      </div>
    );
  }

  if (!rows.length && !showNew) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No section styles yet</CardTitle>
          <CardDescription>
            Initialize collections with sample home page sections, or add your first section style.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={handleInitialize} disabled={initializing}>
            {initializing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Layout className="w-4 h-4 mr-2" />}
            Initialize with home page defaults
          </Button>
          <Button variant="outline" onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add section manually
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Match <strong>section_id</strong> to <code className="text-xs">SectionTheme</code> on the
          website. Use <strong>page_slug</strong> (e.g. <code className="text-xs">home</code>) to scope
          styles per page.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Reload
          </Button>
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New section
          </Button>
        </div>
      </div>

      {showNew && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">New section style</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Section ID</Label>
              <Input
                value={draft.section_id}
                onChange={(e) => setDraft((d) => ({ ...d, section_id: e.target.value }))}
                placeholder="hero"
              />
            </div>
            <div className="space-y-2">
              <Label>Page slug</Label>
              <Input
                value={draft.page_slug}
                onChange={(e) => setDraft((d) => ({ ...d, page_slug: e.target.value }))}
                placeholder="home"
              />
            </div>
            {SECTION_STYLE_COLOR_FIELDS.map((f) => (
              <ColorField
                key={f.name}
                label={f.display_name}
                value={String(draft[f.name as keyof typeof draft] ?? '')}
                onChange={(v) => setDraft((d) => ({ ...d, [f.name]: v }))}
              />
            ))}
            <div className="flex items-center gap-2 md:col-span-2">
              <Checkbox
                checked={draft.is_active !== false}
                onCheckedChange={(c) => setDraft((d) => ({ ...d, is_active: !!c }))}
              />
              <Label>Active</Label>
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button onClick={createRow} disabled={savingId === 'new'}>
                Create section
              </Button>
              <Button variant="ghost" onClick={() => setShowNew(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <Card key={row.id} className={row.is_active === false ? 'opacity-60' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-mono">{row.section_id}</CardTitle>
              <CardDescription>
                Page: {row.page_slug || '(all)'}
                {row.is_active === false && ' · inactive'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SectionPreviewCard row={row} />
              <div className="grid gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Page slug</Label>
                  <Input
                    value={row.page_slug ?? ''}
                    onChange={(e) => updateRow(row.id, { page_slug: e.target.value })}
                  />
                </div>
                {SECTION_STYLE_COLOR_FIELDS.map((f) => (
                  <ColorField
                    key={f.name}
                    label={f.display_name}
                    value={String(row[f.name as keyof SectionRow] ?? '')}
                    onChange={(v) => updateRow(row.id, { [f.name]: v })}
                  />
                ))}
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={row.is_active !== false}
                    onCheckedChange={(c) => updateRow(row.id, { is_active: !!c })}
                  />
                  <Label className="text-sm">Active</Label>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={() => saveRow(row)}
                disabled={savingId === row.id}
              >
                {savingId === row.id ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save section
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
