import { useState, useEffect } from 'react';

interface HealthResponse {
  success: boolean;
  message?: string;
}

export function useBackendReadiness(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    const maxRetries = 5;
    const retryDelay = 1500; // 1.5 seconds

    const checkReadiness = async () => {
      try {
        if (isCancelled) return;

        if (!enabled) {
          setIsReady(true);
          setIsLoading(false);
          setError(null);
          return;
        }

        // Always use same-origin health proxy to avoid CORS and env drift
        const url = '/health';
        const response = await fetch(url, { cache: 'no-store' });
        
        if (response.ok) {
          // Health endpoint returns a simple success payload
          const data: HealthResponse = await response.json().catch(() => ({ success: true }));
          if (data && (data.success || response.status === 200)) {
            if (!isCancelled) {
              setIsReady(true);
              setIsLoading(false);
              setError(null);
            }
            return;
          }
        }
        
        if (!isCancelled) {
          setError(`HTTP ${response.status}: ${response.statusText}`);
          if (retryCount < maxRetries) {
            setTimeout(() => {
              if (!isCancelled) {
                setRetryCount(prev => prev + 1);
              }
            }, retryDelay);
          } else {
            setIsLoading(false);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setError(`Network error: ${errorMessage}`);
          if (retryCount < maxRetries) {
            setTimeout(() => {
              if (!isCancelled) {
                setRetryCount(prev => prev + 1);
              }
            }, retryDelay);
          } else {
            setIsLoading(false);
          }
        }
      }
    };

    // Initial check
    checkReadiness();

    // Cleanup function
    return () => {
      isCancelled = true;
    };
  }, [retryCount, enabled]);

  return { isReady, isLoading, error, retryCount };
}