"use client";

import React, { useState, useEffect } from 'react';

interface EnhancedLoadingComponentProps {
  retryCount: number;
  maxRetries: number;
  error?: any;
  onRetry?: () => void;
}

const EnhancedLoadingComponent: React.FC<EnhancedLoadingComponentProps> = ({ 
  retryCount, 
  maxRetries, 
  error,
  onRetry
}) => {
  // State to track if we're showing the retry button
  const [showRetry, setShowRetry] = useState(false);
  
  // Show retry button after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRetry(true);
    }, 10000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Reset showRetry when retryCount changes
  useEffect(() => {
    setShowRetry(false);
  }, [retryCount]);

  if (retryCount === 0) {
    return (
      // Changed from opaque background to glass morphism effect
      <div className="flex flex-col items-center justify-center p-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 dark:border-gray-700/50">
        <div className="mb-4 text-lg font-medium text-gray-800 dark:text-gray-200">Loading content...</div>
        <div className="mb-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
        <div className="text-gray-600 dark:text-gray-400 text-center">
          <p>Getting things ready for you...</p>
        </div>
      </div>
    );
  }
  
  if (retryCount > 0 && retryCount < maxRetries) {
    // Calculate progress percentage with a minimum of 10% to show some progress immediately
    const progress = Math.min(Math.max(Math.round((retryCount / maxRetries) * 100), 10), 95);
    
    // Friendly messages based on retry count
    let statusMessage = "Backend is starting up, please wait...";
    if (retryCount > 5) {
      statusMessage = "Still working on it... The server is warming up.";
    }
    if (retryCount > 15) {
      statusMessage = "Almost there! Just a bit more time...";
    }
    
    return (
      // Changed from opaque background to glass morphism effect
      <div className="flex flex-col items-center justify-center p-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 dark:border-gray-700/50">
        <div className="mb-4 text-lg font-medium text-gray-800 dark:text-gray-200">
          {statusMessage}
        </div>
        <div className="mb-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
        <div className="w-full max-w-xs mb-2">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        <div className="text-gray-600 dark:text-gray-400 text-center mb-4">
          <p>Waiting for the server to spin up... This can take up to 30 seconds on the free tier.</p>
          <p className="mt-1 text-sm">Retry attempt {retryCount} of {maxRetries}</p>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Did you know? Free tier servers go to sleep after 15 minutes of inactivity to save resources.
          </p>
        </div>
        {showRetry && (
          <button 
            className="mt-2 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors duration-200"
            onClick={onRetry}
          >
            Try Now
          </button>
        )}
      </div>
    );
  }
  
  return (
    // Changed from opaque background to glass morphism effect
    <div className="flex flex-col items-center justify-center p-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 dark:border-gray-700/50">
      <div className="mb-4 text-lg font-medium text-red-600 dark:text-red-400">
        The backend took too long to start. Please try again.
      </div>
      <div className="text-gray-600 dark:text-gray-400 text-center mb-4">
        <p>Sorry, we couldn't connect to the server. This might be due to:</p>
        <ul className="list-disc list-inside mt-2 text-left">
          <li>Server is still initializing</li>
          <li>Network connectivity issues</li>
          <li>Server resource limitations</li>
        </ul>
        <p className="mt-3 text-sm">
          Don't worry! This is normal for free tier deployments. The server will be ready soon.
        </p>
      </div>
      <button 
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors duration-200"
        onClick={() => {
          if (onRetry) {
            onRetry();
          } else {
            window.location.reload();
          }
        }}
      >
        Retry Now
      </button>
    </div>
  );
};

export default EnhancedLoadingComponent;