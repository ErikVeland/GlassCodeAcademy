import React from 'react';

// Local type to represent quiz prefetch status used by LoadingScreen
// Matches the shape returned by quizPrefetchService.getPrefetchStatus()
interface PrefetchStatus {
  isPrefetching: boolean;
  queueLength: number;
  prefetchedCount: number;
}

interface LoadingScreenProps {
  message?: string;
  prefetchStatus?: PrefetchStatus | null;
  spinnerSize?: number; // tailwind size in px
}

export default function LoadingScreen({ message = 'Loading...', prefetchStatus = null, spinnerSize = 48 }: LoadingScreenProps) {
  const sizeClass = `h-[${spinnerSize}px] w-[${spinnerSize}px]`;
  return (
    <div className="min-h-screen flex items-center justify-center p-6" aria-busy="true" aria-live="polite">
      <div className="glass-morphism w-full max-w-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-md px-6 py-5">
        <div className="flex items-center gap-4">
          <svg className={`animate-spin ${sizeClass} text-blue-600 dark:text-blue-500`} viewBox="0 0 24 24" role="img" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{message}</p>
          </div>
        </div>
        {prefetchStatus && (
          <div className="mt-4 text-sm text-gray-700 dark:text-gray-300">
            {prefetchStatus.isPrefetching ? (
              <div>
                <span>Background prefetching in progress…</span>
                <div className="mt-2 w-full">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full"
                      style={{ width: `${Math.min(100, Math.round((prefetchStatus.prefetchedCount / Math.max(1, prefetchStatus.prefetchedCount + prefetchStatus.queueLength)) * 100))}%` }}
                    ></div>
                  </div>
                  <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                    {prefetchStatus.prefetchedCount} of {prefetchStatus.prefetchedCount + prefetchStatus.queueLength} quizzes loaded
                  </div>
                </div>
              </div>
            ) : (
              <span>Ready to load content</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
