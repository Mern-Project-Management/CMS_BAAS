'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Pencil, Trash2, FileText, ExternalLink } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalCount = records.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentRecords = records.slice(startIndex, endIndex);

  // Clamp current page when data size changes
  useEffect(() => {
    if (currentPage > 1 && currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  const renderPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage(i);
              }}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      const showEllipsisStart = currentPage > 3;
      const showEllipsisEnd = currentPage < totalPages - 2;

      pages.push(
        <PaginationItem key={1}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(1);
            }}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      if (showEllipsisStart) {
        pages.push(
          <PaginationItem key="ell-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (i === 1 || i === totalPages) continue;
        pages.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage(i);
              }}
              isActive={currentPage === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (showEllipsisEnd) {
        pages.push(
          <PaginationItem key="ell-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      pages.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(totalPages);
            }}
            isActive={currentPage === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return pages;
  };

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
            currentRecords.map((r, idx) => (
              <TableRow key={r.id} className="group hover:bg-blue-50/40 transition-colors">
                {/* # */}
                <TableCell className="text-slate-400 text-xs font-mono">{startIndex + idx + 1}</TableCell>

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

      {/* ── Pagination ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Show</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              setPageSize(Number(val));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-16 h-8 text-black bg-white border border-slate-200">
              <SelectValue placeholder={String(pageSize)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>entries per page</span>
          {totalCount > 0 && (
            <span className="ml-4 font-medium text-slate-700">
              Showing {startIndex + 1} to {Math.min(endIndex, totalCount)} of {totalCount} entries
            </span>
          )}
        </div>

        {totalPages > 1 && (
          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) setCurrentPage(currentPage - 1);
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {renderPageNumbers()}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                  }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}