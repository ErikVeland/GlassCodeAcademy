'use client';

import React from 'react';
import { useBackendReadiness } from '../hooks/useBackendReadiness';
import { ContentLoading } from './ContentLoading';
import { ContentError } from './ContentError';

interface BackendReadinessWrapperProps {
  children: React.ReactNode;
}

export function BackendReadinessWrapper({ children }: BackendReadinessWrapperProps) {
  const { isReady, isLoading, error, retryCount } = useBackendReadiness();

  // If we're ready or if we've been waiting for a long time, show content
  if (isReady || retryCount > 5) {
    return <>{children}</>;
  }

  // Show loading state
  if (isLoading) {
    return <ContentLoading retryCount={retryCount} />;
  }

  // Show error state
  if (error) {
    return (
      <ContentError 
        message={error} 
        onRetry={() => {
          // Reset the retry count to trigger a new check
          window.location.reload();
        }} 
      />
    );
  }

  // Fallback - should not happen
  return <>{children}</>;
}