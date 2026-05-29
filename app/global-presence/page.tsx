'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Pencil, Trash2 } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
interface LocationEntry {
  id: string;
  label: string;
  address: string;
  phone: { href: string; label: string };
  email: { href: string; label: string };
  position: { top: string; left: string };
  created_at: string;
}

const EMPTY_FORM = {
  label: '',
  address: '',
  phoneLabel: '',
  phoneHref: '',
  emailLabel: '',
  emailHref: '',
  top: '50%',
  left: '50%',
};

// ── Component ──────────────────────────────────────────────────────────────
export default function GlobalPresencePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [entries, setEntries] = useState<LocationEntry[]>([]);
  const [fetching, setFetching] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LocationEntry | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<LocationEntry | null>(null);

  // Map pin placement
  const mapRef = useRef<HTMLDivElement>(null);
  const [placingPin, setPlacingPin] = useState(false);

  // Keep a ref copy of form so it survives dialog close/reopen
  const formRef = useRef(EMPTY_FORM);
  const editTargetRef = useRef<LocationEntry | null>(null);

  // ── Auth guard ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  // ── Fetch entries ─────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/global-presence')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setEntries(res.data);
      })
      .finally(() => setFetching(false));
  }, []);

  // ── Sync form → ref whenever form changes ─────────────────────────────
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  // ── Map click → capture position, reopen dialog ──────────────────────
  const handleMapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!placingPin) return;
    e.stopPropagation();

    const rect = mapRef.current!.getBoundingClientRect();
    const top = (((e.clientY - rect.top) / rect.height) * 100).toFixed(1) + '%';
    const left = (((e.clientX - rect.left) / rect.width) * 100).toFixed(1) + '%';

    // Update both state and ref
    const updated = { ...formRef.current, top, left };
    formRef.current = updated;
    setForm(updated);
    setPlacingPin(false);

    // Restore the edit target and reopen dialog
    setEditTarget(editTargetRef.current);
    setDialogOpen(true);
  }, [placingPin]);

  // ── Open dialog ───────────────────────────────────────────────────────
  const openCreate = () => {
    editTargetRef.current = null;
    setEditTarget(null);
    setForm(EMPTY_FORM);
    formRef.current = EMPTY_FORM;
    setDialogOpen(true);
  };

  const openEdit = (entry: LocationEntry) => {
    const f = {
      label: entry.label,
      address: entry.address,
      phoneLabel: entry.phone?.label ?? '',
      phoneHref: entry.phone?.href ?? '',
      emailLabel: entry.email?.label ?? '',
      emailHref: entry.email?.href ?? '',
      top: entry.position?.top ?? '50%',
      left: entry.position?.left ?? '50%',
    };
    editTargetRef.current = entry;
    setEditTarget(entry);
    setForm(f);
    formRef.current = f;
    setDialogOpen(true);
  };

  // ── "Pick on map" button ──────────────────────────────────────────────
  const startPickingPin = () => {
    // Save current form to ref before closing dialog
    formRef.current = form;
    editTargetRef.current = editTarget;
    setDialogOpen(false);
    // Small delay so the dialog close animation finishes before we
    // enter picking mode — prevents the close-click from being
    // misread as a map placement click
    setTimeout(() => setPlacingPin(true), 300);
  };

  // ── Cancel pin picking (Escape key) ──────────────────────────────────
  useEffect(() => {
    if (!placingPin) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPlacingPin(false);
        setEditTarget(editTargetRef.current);
        setForm(formRef.current);
        setDialogOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [placingPin]);

  // ── Save (create or update) ───────────────────────────────────────────
  const handleSave = async () => {
    if (!form.label || !form.address) return;
    setSaving(true);

    const payload = {
      label: form.label,
      address: form.address,
      phone: { href: form.phoneHref, label: form.phoneLabel },
      email: { href: form.emailHref, label: form.emailLabel },
      position: { top: form.top, left: form.left },
    };

    const url = editTarget
      ? `/api/global-presence/${editTarget.id}`
      : '/api/global-presence';
    const method = editTarget ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        if (editTarget) {
          // Update existing entry in place — pin moves on map immediately
          setEntries((prev) =>
            prev.map((e) => (e.id === editTarget.id ? json.data : e))
          );
        } else {
          // Prepend new entry — pin appears on map immediately
          setEntries((prev) => [json.data, ...prev]);
        }
        setDialogOpen(false);
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/global-presence/${deleteTarget.id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (json.success) {
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  // ── Render ────────────────────────────────────────────────────────────
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Global Presence</h2>
          <p className="text-muted-foreground mt-1">
            Manage office locations shown on the website map.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Location
        </Button>
      </div>

      {/* Interactive SVG Map */}
      <div className="rounded-xl border border-border overflow-hidden bg-muted/30">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Map Preview — click a pin to edit
          </span>
          {placingPin && (
            <Badge variant="secondary" className="animate-pulse">
              📍 Click anywhere on the map to place the pin — press Esc to cancel
            </Badge>
          )}
        </div>
        <div
          ref={mapRef}
          onClick={handleMapClick}
          style={{
            position: 'relative',
            cursor: placingPin ? 'crosshair' : 'default',
            userSelect: 'none',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/map.svg"
            alt="World Map"
            style={{ width: '100%', display: 'block', opacity: 0.85 }}
            draggable={false}
          />

          {/* Existing pins */}
          {entries.map((entry) => (
            <button
              key={entry.id}
              onClick={(e) => {
                if (placingPin) return; // let map click handle it
                e.stopPropagation();
                openEdit(entry);
              }}
              title={`${entry.label}: ${entry.address}`}
              style={{
                position: 'absolute',
                top: entry.position?.top ?? '50%',
                left: entry.position?.left ?? '50%',
                transform: 'translate(-50%, -100%)',
                background: 'none',
                border: 'none',
                cursor: placingPin ? 'crosshair' : 'pointer',
                padding: 0,
                zIndex: 10,
              }}
            >
              <MapPin
                className="w-6 h-6 drop-shadow-md"
                style={{ color: '#f0a500', fill: '#f0a500' }}
              />
            </button>
          ))}

          {/* Preview pin while placing */}
          {placingPin && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -100%)',
                pointerEvents: 'none',
                opacity: 0.5,
                zIndex: 20,
              }}
            >
              <MapPin className="w-6 h-6" style={{ color: '#f0a500', fill: '#f0a500' }} />
            </div>
          )}
        </div>
      </div>

      {/* Entries Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Label</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Address</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Position</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {fetching ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-muted-foreground">
                  No locations yet. Click "Add Location" to get started.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{entry.label}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{entry.address}</td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.phone?.label || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.email?.label || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">
                    {entry.position?.top}, {entry.position?.left}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(entry)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(entry)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Location' : 'Add Location'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>Label *</Label>
                <Input
                  placeholder="e.g. Head office"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Address *</Label>
                <Input
                  placeholder="Full address"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Phone label</Label>
                <Input
                  placeholder="+1 (009) 544-7818"
                  value={form.phoneLabel}
                  onChange={(e) => setForm((f) => ({ ...f, phoneLabel: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Phone href</Label>
                <Input
                  placeholder="tel:10095447818"
                  value={form.phoneHref}
                  onChange={(e) => setForm((f) => ({ ...f, phoneHref: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Email label</Label>
                <Input
                  placeholder="support@bexon.com"
                  value={form.emailLabel}
                  onChange={(e) => setForm((f) => ({ ...f, emailLabel: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Email href</Label>
                <Input
                  placeholder="mailto:support@bexon.com"
                  value={form.emailHref}
                  onChange={(e) => setForm((f) => ({ ...f, emailHref: e.target.value }))}
                />
              </div>
            </div>

            {/* Pin position */}
            <div className="space-y-2">
              <Label>Pin position on map</Label>
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <span className="text-xs text-muted-foreground">Top %</span>
                  <Input
                    value={form.top}
                    onChange={(e) => setForm((f) => ({ ...f, top: e.target.value }))}
                    placeholder="30%"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <span className="text-xs text-muted-foreground">Left %</span>
                  <Input
                    value={form.left}
                    onChange={(e) => setForm((f) => ({ ...f, left: e.target.value }))}
                    placeholder="20%"
                  />
                </div>
                <div className="pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={startPickingPin}
                    className="gap-1 whitespace-nowrap"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Pick on map
                  </Button>
                </div>
              </div>
              {form.top !== '50%' || form.left !== '50%' ? (
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  ✓ Position set: {form.top}, {form.left}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Click "Pick on map" to click directly on the map, or type percentages manually.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.label || !form.address}
            >
              {saving ? 'Saving…' : editTarget ? 'Save changes' : 'Add location'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete location?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleteTarget?.label}</strong> from the map.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
