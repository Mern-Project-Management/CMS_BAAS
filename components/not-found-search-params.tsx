'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

/**
 * Client component to safely use useSearchParams on the 404 page.
 * It can display information about the path that was not found.
 */
function NotFoundSearchParamsInner() {
  const searchParams = useSearchParams();
  const path = searchParams.get('path'); // Assuming the 404 page might receive the original path via a 'path' search param

  return (
    <p className="text-lg text-gray-600">The requested resource {path ? <strong>{decodeURIComponent(path)}</strong> : ''} could not be found.</p>
  );
}

export function NotFoundSearchParams() {
  return (
    <Suspense fallback={<p className="text-lg text-gray-600">Loading...</p>}>
      <NotFoundSearchParamsInner />
    </Suspense>
  );
}