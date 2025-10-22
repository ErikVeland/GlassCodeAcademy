'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { quizPrefetchService } from '@/lib/quizPrefetchService';

/**
 * Component to test and display quiz prefetching status
 * This is for testing purposes only
 */
export default function QuizPrefetchTest() {
  const searchParams = useSearchParams();
  const debugParam = (searchParams && 'get' in searchParams) ? searchParams.get('debug') : null;
  const showDebug = debugParam !== null && debugParam !== 'false' && debugParam !== '0';

  const [status, setStatus] = useState({
    isPrefetching: false,
    queueLength: 0,
    prefetchedCount: 0
  });
  const [cacheInfo, setCacheInfo] = useState({
    sessionStorageCount: 0,
    localStorageCount: 0
  });

  useEffect(() => {
    if (!showDebug) return;

    // Update status periodically only when debug is enabled
    const interval = setInterval(() => {
      const prefetchStatus = quizPrefetchService.getPrefetchStatus();
      setStatus(prefetchStatus);
      
      // Count cached items
      let sessionStorageCount = 0;
      let localStorageCount = 0;
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('prefetch_quiz_')) {
          sessionStorageCount++;
        }
      }
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('quiz_prefetch_')) {
          localStorageCount++;
        }
      }
      
      setCacheInfo({
        sessionStorageCount,
        localStorageCount
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [showDebug]);

  const handleClearCache = () => {
    // Clear sessionStorage cache
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('prefetch_quiz_')) {
        sessionStorage.removeItem(key);
      }
    }
    
    // Clear localStorage cache
    quizPrefetchService.clearCache();
  };

  const handleStartPrefetch = () => {
    quizPrefetchService.startPrefetching('tier');
  };

  // Hide unless ?debug is present
  if (!showDebug) {
    return null;
  }

  return (
    <div className="fixed top-24 right-5 z-[900]">
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg">
        <div className="mb-2">
          <strong>Quiz Prefetch Test</strong>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Prefetching:</span>
            <span className="text-gray-100">{status.isPrefetching ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Queue Length:</span>
            <span className="text-gray-100">{status.queueLength}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Prefetched:</span>
            <span className="text-gray-100">{status.prefetchedCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-300">Local Cache:</span>
            <span className="text-gray-900 dark:text-white">{cacheInfo.localStorageCount}</span>
          </div>
        </div>
        
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleStartPrefetch}
            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            Start
          </button>
          <button
            onClick={handleClearCache}
            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
          >
            Clear Cache
          </button>
        </div>
      </div>
    </div>
  );
}