/**
 * Hierarchical Breadcrumb Component
 * Displays the path from root to current record
 * 
 * Example:
 * <HierarchicalBreadcrumb
 *   collectionId="categories_id"
 *   recordId="record_id"
 *   onNavigate={handleBreadcrumbClick}
 * />
 * 
 * Output: Root > Level 1 > Level 2 > Current
 */

'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BreadcrumbItem {
  id: string;
  name: string;
  display_name?: string;
}

interface Props {
  collectionId: string;
  recordId: string;
  onNavigate?: (recordId: string) => void;
  separator?: React.ReactNode;
  maxItems?: number;
  linkClassName?: string;
  containerClassName?: string;
}

export function HierarchicalBreadcrumb({
  collectionId,
  recordId,
  onNavigate,
  separator = <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />,
  maxItems,
  linkClassName =
    'text-blue-600 hover:text-blue-800 hover:underline cursor-pointer',
  containerClassName = 'flex items-center flex-wrap gap-0 text-sm',
}: Props) {
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBreadcrumb();
  }, [collectionId, recordId]);

  async function fetchBreadcrumb() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/breadcrumbs/${collectionId}/${recordId}`
      );

      if (!res.ok) {
        throw new Error('Failed to fetch breadcrumb');
      }

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Unknown error');
      }

      let items = json.data || [];

      // Limit items if maxItems is specified
      if (maxItems && items.length > maxItems) {
        // Keep first item and last maxItems-1 items
        items = [items[0], { name: '...', id: 'ellipsis', display_name: '...' }, ...items.slice(-(maxItems - 2))];
      }

      setBreadcrumb(items);
    } catch (err) {
      console.error('Error fetching breadcrumb:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Error loading breadcrumb'
      );
      setBreadcrumb([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <Skeleton className="h-6 w-64" />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="text-xs">
        <AlertCircle className="h-3 w-3" />
        <AlertDescription className="text-xs">{error}</AlertDescription>
      </Alert>
    );
  }

  if (breadcrumb.length === 0) {
    return <div className="text-sm text-muted-foreground">No path found</div>;
  }

  return (
    <nav className={containerClassName} aria-label="Breadcrumb">
      {breadcrumb.map((item, index) => (
        <div key={item.id} className="flex items-center">
          {index > 0 && separator}
          {item.id === 'ellipsis' ? (
            <span className="text-muted-foreground mx-1">…</span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className={`h-auto p-0 ${linkClassName}`}
              onClick={() => onNavigate?.(item.id)}
              disabled={index === breadcrumb.length - 1}
            >
              {item.display_name || item.name}
            </Button>
          )}
        </div>
      ))}
    </nav>
  );
}
