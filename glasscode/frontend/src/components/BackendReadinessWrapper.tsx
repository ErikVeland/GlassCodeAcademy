'use client';

import React from 'react';
import { useBackendReadiness } from '../hooks/useBackendReadiness';
import LoadingScreen from './LoadingScreen';
import { ContentError } from './ContentError';
import { usePathname } from 'next/navigation';

export default function BackendReadinessWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isReady, isLoading, error, retryCount } = useBackendReadiness({ enabled: pathname !== '/' });

  // Do not gate the home route with any loading screen
  if (pathname === '/') {
    return <>{children}</>;
  }

  // If we're ready or we've retried enough, show content
  if (isReady || retryCount > 5) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <LoadingScreen message="Loading content..." />;
  }

  if (error) {
    return <ContentError message={error} />;
  }

  return <>{children}</>;
}