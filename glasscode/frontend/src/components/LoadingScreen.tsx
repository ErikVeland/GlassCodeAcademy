'use client';

import React from 'react';

interface PrefetchStatus {
  isPrefetching: boolean;
  prefetchedCount: number;
  queueLength: number;
}

interface LoadingScreenProps {
  message?: string;
  prefetchStatus?: PrefetchStatus | null;
  spinnerSize?: number; // tailwind size in px
}

export default function LoadingScreen({ message = 'Loading...', prefetchStatus = null, spinnerSize = 48 }: LoadingScreenProps) {
  const sizeClass = `h-[${spinnerSize}px] w-[${spinnerSize}px]`;
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className={`animate-spin rounded-full ${sizeClass} border-b-2 border-blue-600 mx-auto mb-4`}></div>
        <p className="text-gray-600 dark:text-gray-300">{message}</p>
        {prefetchStatus && (
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            {prefetchStatus.isPrefetching ? (
              <div>
                <span>Background prefetching in progress... </span>
                <div className="mt-2 w-64 mx-auto">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${Math.min(100, Math.round((prefetchStatus.prefetchedCount / Math.max(1, prefetchStatus.prefetchedCount + prefetchStatus.queueLength)) * 100))}%` }}
                    ></div>
                  </div>
                  <div className="text-xs mt-1">
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