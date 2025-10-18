import { ApolloClient, InMemoryCache, HttpLink, NormalizedCacheObject } from '@apollo/client';
import { RetryLink } from '@apollo/client/link/retry';
import { getGraphQLEndpoint } from '@/lib/urlUtils';

// Custom function to determine if we should retry based on error
const shouldRetry = (error: unknown) => {
  // Narrow the error shape
  const err = (error && typeof error === 'object') ? (error as { message?: string; statusCode?: number }) : undefined;
  const msg = err?.message ?? '';
  const code = err?.statusCode;
  // Retry on network errors or server errors that might be due to cold start
  return (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('timeout') ||
    msg.includes('502') ||  // Bad gateway
    msg.includes('503') ||  // Service unavailable
    msg.includes('504') ||  // Gateway timeout
    [408, 502, 503, 504].includes(code ?? -1)
  );
};

const retryLink = new RetryLink({
  delay: {
    initial: 300, // Reduced from 1000 to 300ms for faster initial retry
    max: 5000,    // Reduced from 15000 to 5000ms between retries
    jitter: true,  // Add randomness to prevent thundering herd
  },
  attempts: {
    max: 3,       // Reduced from 15 to 3 retry attempts
    retryIf: (error) => shouldRetry(error),
  },
});

export const createApolloClient = () => {
  // Use the GraphQL endpoint utility function to get the correct URL
  const graphqlUrl = getGraphQLEndpoint();
  
  return new ApolloClient({
    link: retryLink.concat(new HttpLink({ 
      uri: graphqlUrl,
      // Add timeout for faster failure detection
      fetch: (uri, options) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        return fetch(uri, {
          ...options,
          signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));
      }
    })),
    cache: new InMemoryCache({
      // Add cache size limits to prevent memory leaks
      typePolicies: {
        Query: {
          fields: {
            // Limit cache size for lesson queries
            lessons: {
              merge: false,
            },
            // Limit cache size for quiz queries
            questions: {
              merge: false,
            }
          }
        }
      }
    }),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'ignore',
        fetchPolicy: 'cache-first',
        // Add timeout for queries
        context: {
          fetchOptions: {
            signal: AbortSignal.timeout(10000) // 10 second timeout
          }
        }
      },
      query: {
        errorPolicy: 'all', // Changed from 'ignore' to 'all' to handle errors properly
        fetchPolicy: 'cache-first',
        // Add timeout for queries
        context: {
          fetchOptions: {
            signal: AbortSignal.timeout(10000) // 10 second timeout
          }
        }
      },
    },
  });
};

// For client components that need a singleton instance
let clientSingleton: ApolloClient<NormalizedCacheObject> | null = null;

export function getApolloClient() {
  if (typeof window === 'undefined') {
    // Server side - always create a new client
    return createApolloClient();
  }
  
  // Client side - create once and reuse
  if (!clientSingleton) {
    clientSingleton = createApolloClient();
  }
  
  return clientSingleton;
}