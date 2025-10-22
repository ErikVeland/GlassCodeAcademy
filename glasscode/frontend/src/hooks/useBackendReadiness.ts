import { useState, useEffect } from 'react';

interface ReadinessResponse {
  status: string;
  reason?: string;
  databaseConnected: boolean;
  contentReady: boolean;
  contentComplete: boolean;
  modules: number;
  lessons: number;
  quizzes: number;
  details?: Record<string, unknown>;
}

export function useBackendReadiness() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    const maxRetries = 10;
    const retryDelay = 2000; // 2 seconds

    const checkReadiness = async () => {
      try {
        if (isCancelled) return;

        const response = await fetch('/api/ready');
        
        if (response.ok) {
          const data: ReadinessResponse = await response.json();
          
          if (data.status === 'ready') {
            if (!isCancelled) {
              setIsReady(true);
              setIsLoading(false);
              setError(null);
            }
            return;
          } else {
            if (!isCancelled) {
              setError(data.reason || 'Backend is not ready');
              
              // Retry if we haven't exceeded max retries
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
            return;
          }
        } else {
          if (!isCancelled) {
            setError(`HTTP ${response.status}: ${response.statusText}`);
            
            // Retry if we haven't exceeded max retries
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
      } catch (err) {
        if (!isCancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setError(`Network error: ${errorMessage}`);
          
          // Retry if we haven't exceeded max retries
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
  }, [retryCount]);

  return { isReady, isLoading, error, retryCount };
}