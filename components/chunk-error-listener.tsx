'use client'

import { useEffect } from 'react'

export function ChunkErrorListener() {
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const errorMsg = event.message || '';
      const isChunkLoadError = 
        errorMsg.includes('ChunkLoadError') || 
        errorMsg.includes('Failed to load chunk') ||
        (event.error && (
          event.error.name === 'ChunkLoadError' ||
          event.error.message?.includes('ChunkLoadError') ||
          event.error.message?.includes('Failed to load chunk')
        ));

      if (isChunkLoadError) {
        console.warn('ChunkLoadError detected. Reloading page to fetch the latest assets...', event);
        window.location.reload();
      }
    };

    // Catch failed script loads (e.g., 404 on next.js dynamic chunks)
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      if (
        target &&
        target.tagName === 'SCRIPT' &&
        ((target as HTMLScriptElement).src || '').includes('_next/static/')
      ) {
        console.warn('Failed to load script chunk. Reloading page...', target);
        window.location.reload();
      }
    };

    window.addEventListener('error', handleGlobalError);
    // Use capture phase (true) to catch resource loading errors which do not bubble
    window.addEventListener('error', handleResourceError, true);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('error', handleResourceError, true);
    };
  }, []);

  return null;
}
