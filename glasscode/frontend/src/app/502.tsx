'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import EnhancedLoadingComponent from '../components/EnhancedLoadingComponent';

export default function Custom502() {
  const [retryCount, setRetryCount] = useState(0);

  // Simulate retry attempts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (retryCount < 30) {
        setRetryCount(prev => prev + 1);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [retryCount]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <EnhancedLoadingComponent 
          retryCount={retryCount} 
          maxRetries={30} 
          onRetry={() => setRetryCount(0)}
        />
      </div>
    </div>
  );
}
