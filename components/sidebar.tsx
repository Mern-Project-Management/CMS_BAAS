'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2, Plus, Database, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-client';
import { useSidebar } from '@/components/context/sidebar-context';
import type { Collection } from '@/lib/types';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSuperadmin } = useAuth();
  const { isOpen, toggle } = useSidebar();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/collections');
        const json = await res.json();
        if (json.success) {
          setCollections(json.data || []);
        }
      } catch (err) {
        console.error('Sidebar fetch collections error', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (pathname.startsWith('/login')) {
    return null;
  }

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
            {collections.map((c) => {
              const isActive = pathname === `/collections/${c.id}`;
              return (
                <Link
                  key={c.id}
                  href={`/collections/${c.id}?collectionName=${c.name}`}
                  className={cn(
                    'group flex items-center text-foreground justify-between rounded-lg transition-all duration-200',
                    isOpen ? 'px-3 py-2.5 gap-2' : 'px-3 py-2.5 justify-center',
                    'hover:bg-accent',
                    isActive
                      ? 'bg-primary text-primary-foreground hover:text-primary-foreground shadow-sm'
                      : 'text-foreground/80 hover:text-foreground'
                  )}
                  title={!isOpen ? c.display_name : undefined}
                >
                  <span className={cn('flex items-center gap-2 flex-1 min-w-0', !isOpen && 'justify-center')}>
                    {c.icon && (
                      <span
                        className={cn(
                          'text-base flex-shrink-0',
                          isActive ? 'text-primary-foreground' : 'text-foreground/60 group-hover:text-foreground'
                        )}
                      >
                        {c.icon}
                      </span>
                    )}
                    {isOpen && <span className="truncate text-sm hover:text-black font-medium">{c.display_name}</span>}
                  </span>
                  {isOpen && c.fieldCount !== undefined && c.fieldCount !== null && (
                    <span
                      className={cn(
                        'ml-2 px-2 py-0.5 rounded-md text-xs font-semibold flex-shrink-0',
                        isActive
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-accent text-foreground/60 group-hover:bg-accent group-hover:text-black'
                      )}
                    >
                      {c.fieldCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* Add Button */}
      {isSuperadmin && (
        <div className="border-t border-border px-3 py-3 flex-shrink-0">
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
