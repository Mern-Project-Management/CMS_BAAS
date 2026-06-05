'use client';

import { Sidebar } from '@/components/sidebar';
import { Suspense } from 'react';

export function ClientSidebar() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
      <Sidebar />
    </Suspense>
  );
}
