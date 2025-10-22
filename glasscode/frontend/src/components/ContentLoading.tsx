import React from 'react';

interface ContentLoadingProps {
  message?: string;
  retryCount?: number;
}

export function ContentLoading({ message = 'Initializing content...', retryCount = 0 }: ContentLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Content</h2>
        <p className="text-gray-600 mb-4">{message}</p>
        {retryCount > 0 && (
          <p className="text-sm text-gray-500">
            Retry attempt {retryCount}/10
          </p>
        )}
        <div className="mt-6">
          <p className="text-xs text-gray-400">
            This may take a moment while we prepare your learning content.
          </p>
        </div>
      </div>
    </div>
  );
}