"use client";

import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import SkeletonLoader from './SkeletonLoader';

interface ContentLoaderProps {
  type: 'lesson' | 'quiz' | 'module';
  moduleName?: string;
  isLoading: boolean;
  hasError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

const ContentLoader: React.FC<ContentLoaderProps> = ({ 
  type,
  moduleName,
  isLoading,
  hasError = false,
  errorMessage,
  onRetry,
  children
}) => {
  // Show error state
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 dark:border-gray-700/50">
        <div className="text-red-500 dark:text-red-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          Content Unavailable
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          {errorMessage || "We're having trouble loading your content. This might be due to a network issue or server connectivity."}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  // Show loading state with skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSpinner 
          moduleName={moduleName}
          message={type === 'lesson' ? 'Loading lesson content...' : 'Loading quiz content...'}
        />
        <div className="mt-8">
          <SkeletonLoader type={type} />
        </div>
      </div>
    );
  }

  // Show content when loaded
  return <>{children}</>;
};

export default ContentLoader;