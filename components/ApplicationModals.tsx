'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, ExternalLink, Save, X } from 'lucide-react';
import type { ApplicationRecord } from './ApplicationsTable';

// ─── Shared label component ──────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
      {children}
    </p>
  );
}

// ─── View Modal ──────────────────────────────────────────────────────────────
type ViewModalProps = {
  record: ApplicationRecord | null;
  onClose: () => void;
};

export function ViewApplicationModal({ record, onClose }: ViewModalProps) {
  if (!record) return null;

  const coverText = record.coverLetter ?? record.cover_letter;

  return (
    <Dialog open={!!record} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-800 text-lg">Application Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Top row: name + position */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600 font-bold text-base uppercase">
              {record.name?.[0] ?? '?'}
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-base leading-tight">{record.name ?? '—'}</p>
              {record.position && (
                <Badge variant="secondary" className="mt-1 bg-blue-50 text-blue-700 border-blue-100 text-xs">
                  {record.position}
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Email</FieldLabel>
              <a href={`mailto:${record.email}`} className="text-sm text-blue-600 hover:underline break-all">
                {record.email ?? '—'}
              </a>
            </div>
            <div>
              <FieldLabel>Phone</FieldLabel>
              <p className="text-sm text-slate-700">{record.phone ?? '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Applied On</FieldLabel>
              <p className="text-sm text-slate-700">
                {record.applied_at
                  ? new Date(record.applied_at).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })
                  : '—'}
              </p>
            </div>
            <div>
              <FieldLabel>CV / Resume</FieldLabel>
              {record.cv_url ? (
                <a
                  href={record.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  View CV
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              ) : (
                <span className="text-sm text-slate-400">—</span>
              )}
            </div>
          </div>

          {coverText && (
            <div>
              <FieldLabel>Cover Letter</FieldLabel>
              <div className="text-sm text-slate-700 bg-slate-50 rounded-lg border border-slate-200 px-3 py-2.5 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {coverText}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────
type EditModalProps = {
  record: ApplicationRecord | null;
  onClose: () => void;
  onSave: (id: string, data: Partial<ApplicationRecord>) => Promise<void>;
  saving?: boolean;
};

export function EditApplicationModal({ record, onClose, onSave, saving = false }: EditModalProps) {
  const [formData, setFormData] = useState<Partial<ApplicationRecord>>({});

  useEffect(() => {
    if (record) {
      setFormData({
        name: record.name ?? '',
        email: record.email ?? '',
        phone: record.phone ?? '',
        position: record.position ?? '',
        coverLetter: record.coverLetter ?? record.cover_letter ?? '',
        cv_url: record.cv_url ?? '',
      });
    }
  }, [record]);

  if (!record) return null;

  const set = (key: string, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    await onSave(record.id, formData);
  };

  return (
    <Dialog open={!!record} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-800">Edit Application</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</label>
              <Input
                value={formData.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Position</label>
              <Input
                value={formData.position ?? ''}
                onChange={(e) => set('position', e.target.value)}
                placeholder="Applied position"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
              <Input
                type="email"
                value={formData.email ?? ''}
                onChange={(e) => set('email', e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</label>
              <Input
                value={formData.phone ?? ''}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CV URL</label>
            <Input
              value={formData.cv_url ?? ''}
              onChange={(e) => set('cv_url', e.target.value)}
              placeholder="/uploads/..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cover Letter</label>
            <Textarea
              value={(formData.coverLetter as string) ?? ''}
              onChange={(e) => set('coverLetter', e.target.value)}
              rows={5}
              placeholder="Applicant's cover letter…"
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={onClose} disabled={saving} className="gap-1.5">
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}