'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Pencil, Trash2, FileText, ExternalLink } from 'lucide-react';

export type ApplicationRecord = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  cv_url?: string;
  coverLetter?: string;
  cover_letter?: string;
  applied_at?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
};

type Props = {
  records: ApplicationRecord[];
  onView: (record: ApplicationRecord) => void;
  onEdit: (record: ApplicationRecord) => void;
  onDelete: (id: string) => void;
  deletingId?: string | null;
};

export function ApplicationsTable({ records, onView, onEdit, onDelete, deletingId }: Props) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wider w-12">#</TableHead>
            <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wider">Name</TableHead>
            <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wider">Email</TableHead>
            <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wider">Phone</TableHead>
            <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wider">Position</TableHead>
            <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wider">CV</TableHead>
            <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wider">Applied</TableHead>
            <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wider text-right pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-slate-400 py-16 text-sm">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-slate-300" />
                  </div>
                  No applications yet.
                </div>
              </TableCell>
            </TableRow>
          ) : (
            records.map((r, idx) => (
              <TableRow key={r.id} className="group hover:bg-blue-50/40 transition-colors">
                {/* # */}
                <TableCell className="text-slate-400 text-xs font-mono">{idx + 1}</TableCell>

                {/* Name */}
                <TableCell className="font-medium text-slate-800 whitespace-nowrap">
                  {r.name ?? <span className="text-slate-300">—</span>}
                </TableCell>

                {/* Email */}
                <TableCell className="text-slate-600 text-sm max-w-[200px] truncate">
                  {r.email ? (
                    <a href={`mailto:${r.email}`} className="hover:text-blue-600 hover:underline transition-colors">
                      {r.email}
                    </a>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </TableCell>

                {/* Phone */}
                <TableCell className="text-slate-600 text-sm whitespace-nowrap">
                  {r.phone ?? <span className="text-slate-300">—</span>}
                </TableCell>

                {/* Position */}
                <TableCell>
                  {r.position ? (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 text-xs font-medium whitespace-nowrap">
                      {r.position}
                    </Badge>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </TableCell>

                {/* CV */}
                <TableCell>
                  {r.cv_url ? (
                    <a
                      href={r.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      View CV
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </TableCell>

                {/* Applied At */}
                <TableCell className="text-slate-500 text-xs whitespace-nowrap">
                  {r.applied_at
                    ? new Date(r.applied_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })
                    : r.created_at
                    ? new Date(r.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })
                    : <span className="text-slate-300">—</span>
                  }
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right pr-3">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-blue-100 hover:text-blue-700 text-slate-400"
                      title="View"
                      onClick={() => onView(r)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-amber-100 hover:text-amber-700 text-slate-400"
                      title="Edit"
                      onClick={() => onEdit(r)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-red-100 hover:text-red-600 text-slate-400"
                      title="Delete"
                      onClick={() => onDelete(r.id)}
                      disabled={deletingId === r.id}
                    >
                      {deletingId === r.id ? (
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-red-300 border-t-red-600 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}