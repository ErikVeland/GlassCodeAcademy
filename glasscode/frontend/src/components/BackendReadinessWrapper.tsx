"use client";

import React from 'react';
import { useBackendReadiness } from '../hooks/useBackendReadiness';
import { usePathname } from 'next/navigation';

export default function BackendReadinessWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isReady, isLoading, error, retryCount } = useBackendReadiness({ enabled: pathname !== '/' });

  const showStatus = (process.env.NODE_ENV !== 'production') || (process.env.NEXT_PUBLIC_SHOW_BACKEND_STATUS === '1');

  return (
    <div className="relative">
      {showStatus && pathname !== '/' && !isReady && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 glass-morphism p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span
              className="inline-block h-4 w-4 rounded-full border-2 border-gray-300 dark:border-gray-600 border-t-blue-600 dark:border-t-blue-500 animate-spin"
              aria-hidden="true"
            />
            <p className="text-sm text-gray-800 dark:text-gray-200">
              {isLoading
                ? 'Connecting to backend…'
                : error
                  ? 'Backend not reachable. Showing local content.'
                  : 'Backend connected.'}
            </p>
            {error && (
              <span className="ml-auto text-xs text-gray-600 dark:text-gray-400">
                {retryCount > 0 ? `Retries: ${retryCount}` : ''}
              </span>
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
