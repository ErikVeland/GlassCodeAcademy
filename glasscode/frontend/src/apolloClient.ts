import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { RetryLink } from '@apollo/client/link/retry';

// Custom function to determine if we should retry based on error
const shouldRetry = (error: any) => {
  // Retry on network errors or server errors that might be due to cold start
  return !!error && (
    error.message?.includes('Failed to fetch') ||
    error.message?.includes('NetworkError') ||
    error.message?.includes('ECONNREFUSED') ||
    error.message?.includes('timeout') ||
    error.message?.includes('502') ||  // Bad gateway
    error.message?.includes('503') ||  // Service unavailable
    error.message?.includes('504') ||  // Gateway timeout
    error.statusCode === 408 ||  // Request timeout
    error.statusCode === 502 ||  // Bad gateway
    error.statusCode === 503 ||  // Service unavailable
    error.statusCode === 504     // Gateway timeout
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
    retryIf: (error, _operation) => shouldRetry(error),
  },
});

export const createApolloClient = () => {
  // Use the base URL from environment variables
  let baseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_BASE_URL || 'https://glasscode.academy'  // Use domain for production
    : process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5023'; // Development fallback
  
  const graphqlUrl = `${baseUrl}/graphql`;
  
  return new ApolloClient({
    link: retryLink.concat(new HttpLink({ 
      uri: graphqlUrl,
      // Add timeout for faster failure detection
      fetch: (uri, options) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        return fetch(uri, {
          ...options,
          signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));
      }
    })),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'ignore',
        fetchPolicy: 'cache-first',
      },
      query: {
        errorPolicy: 'all', // Changed from 'ignore' to 'all' to handle errors properly
        fetchPolicy: 'cache-first',
      },
    },
  });
};

// For client components that need a singleton instance
let clientSingleton: ApolloClient<any> | null = null;

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