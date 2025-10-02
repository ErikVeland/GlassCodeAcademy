'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import EnhancedLoadingComponent from '../components/EnhancedLoadingComponent';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [retryCount, setRetryCount] = useState(0);
  const [shouldRetry, setShouldRetry] = useState(true);

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error caught:', error);
    
    // If this is a 502 error, we want to automatically retry
    if (error.message?.includes('502') || error.message?.includes('Bad Gateway')) {
      // Start the retry process
      const retryTimer = setTimeout(() => {
        if (retryCount < 30) {
          setRetryCount(prev => prev + 1);
          reset();
        } else {
          setShouldRetry(false);
        }
      }, 2000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [error, retryCount, reset]);

  // If we're dealing with a 502 error, show our enhanced loading component
  if ((error.message?.includes('502') || error.message?.includes('Bad Gateway')) && shouldRetry) {
    return (
      <html>
        <body>
          <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md">
              <EnhancedLoadingComponent 
                retryCount={retryCount} 
                maxRetries={30} 
                error={error}
                onRetry={() => {
                  setRetryCount(0);
                  reset();
                }}
              />
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Something went wrong!</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {error.message || 'An unexpected error occurred'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                onClick={() => {
                  setRetryCount(0);
                  reset();
                }}
              >
                Try Again
              </button>
              <Link 
                href="/" 
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-center"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}