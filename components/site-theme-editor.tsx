'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Palette, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorField } from '@/components/color-field';
import { useToast } from '@/hooks/use-toast';
import {
  SITE_THEME_COLLECTION,
  SITE_THEME_COLOR_FIELDS,
} from '@/lib/theme-schema';

type ThemeRecord = Record<string, string | boolean | undefined> & { id?: string };

export function SiteThemeEditor() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [record, setRecord] = useState<ThemeRecord | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/data/${SITE_THEME_COLLECTION}`);
      const json = await res.json();
      if (!json.success) {
        setRecord(null);
        return;
      }
      const rows = Array.isArray(json.data) ? json.data : [];
      const row = rows.find((r: ThemeRecord) => r.key === 'default') || rows[0] || null;
      setRecord(row);
      if (row) {
        const next: Record<string, string> = { key: String(row.key ?? 'default') };
        for (const f of SITE_THEME_COLOR_FIELDS) {
          next[f.name] = String(row[f.name] ?? f.default);
        }
        setForm(next);
      }
    } catch {
      toast({ title: 'Error', description: 'Could not load site theme', variant: 'destructive' });
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
      toast({ title: 'Ready', description: 'Theme collections created. Loading…' });
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

  async function handleSave() {
    if (!record?.id) return;
    setSaving(true);
    try {
      const body: Record<string, string> = { key: form.key || 'default' };
      for (const f of SITE_THEME_COLOR_FIELDS) {
        body[f.name] = form[f.name] ?? f.default;
      }
      const res = await fetch(`/api/data/${SITE_THEME_COLLECTION}/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Save failed');
      toast({ title: 'Saved', description: 'Global site colors updated.' });
      await load();
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Save failed',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading site theme…
      </div>
    );
  }

  if (!record) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Site theme not set up</CardTitle>
          <CardDescription>
            Create the <code className="text-xs">site_theme</code> collection and default record to
            manage global brand colors for your website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleInitialize} disabled={initializing}>
            {initializing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Palette className="w-4 h-4 mr-2" />
            )}
            Initialize theme collections
          </Button>
        </CardContent>
      </Card>
    );
  }

  const previewVars = SITE_THEME_COLOR_FIELDS.reduce(
    (acc, f) => {
      acc[`--preview-${f.name}`] = form[f.name] || f.default;
      return acc;
    },
    {} as Record<string, string>,
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Global brand colors
          </CardTitle>
          <CardDescription>
            These map to CSS variables on your website (<code className="text-xs">--tj-color-*</code>
            ). Changes apply after the frontend revalidates (about 60s).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {SITE_THEME_COLOR_FIELDS.map((f) => (
            <ColorField
              key={f.name}
              label={f.display_name}
              value={form[f.name] ?? f.default}
              onChange={(v) => setForm((prev) => ({ ...prev, [f.name]: v }))}
            />
          ))}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save global theme
            </Button>
            <Button type="button" variant="outline" onClick={load}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Live preview</CardTitle>
          <CardDescription>Approximate look on the marketing site</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="rounded-xl border border-border p-6 space-y-4 min-h-[280px]"
            style={{
              backgroundColor: previewVars['--preview-theme_bg'],
              color: previewVars['--preview-body_text_color'],
            }}
          >
            <p
              className="text-2xl font-bold"
              style={{ color: previewVars['--preview-heading_color'] }}
            >
              Sample heading
            </p>
            <p className="text-sm opacity-90">
              Body text uses your body color. Primary buttons and links use the brand primary.
            </p>
            <button
              type="button"
              className="px-4 py-2 rounded-md text-sm font-medium text-white"
              style={{ backgroundColor: previewVars['--preview-primary_color'] }}
            >
              Primary button
            </button>
            <div
              className="mt-4 p-4 rounded-lg text-sm text-white"
              style={{ backgroundColor: previewVars['--preview-dark_color'] }}
            >
              Dark accent block (footer / CTA style)
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
