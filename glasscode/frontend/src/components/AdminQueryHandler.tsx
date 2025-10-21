'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * AdminQueryHandler
 * Handles admin URL query parameters:
 * - ?reset: clears localStorage, sessionStorage, and browser caches, then removes query params
 * - ?unlock / ?lock: interpreted by pages/components via useSearchParams
 */
export default function AdminQueryHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const hasReset = !!searchParams && (searchParams.has('reset') || searchParams.has('rest'));
    if (typeof window !== 'undefined' && hasReset) {
      try {
        // Clear storages
        window.localStorage?.clear?.();
        window.sessionStorage?.clear?.();

        // Clear caches if available
        if ('caches' in window) {
          caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(() => {});
        }

        // Remove query params from URL to avoid repeated resets
        const url = new URL(window.location.href);
        url.searchParams.delete('reset');
        url.searchParams.delete('rest');
        url.searchParams.delete('unlock');
        url.searchParams.delete('lock');
        window.history.replaceState({}, '', url.pathname + (url.search ? '?' + url.searchParams.toString() : '') + url.hash);

        // Reload to ensure a clean app state
        window.location.reload();
      } catch (err) {
        // best-effort; avoid throwing during hydration
        console.warn('Admin reset failed or partially completed:', err);
      }
    }
  }, [searchParams]);

  return null;
}