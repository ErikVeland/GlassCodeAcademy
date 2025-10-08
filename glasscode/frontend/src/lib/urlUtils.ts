/**
 * Utility functions for URL handling
 */

/**
 * Convert HTTPS domain URL to HTTP localhost URL for backend calls
 * This is used in production where the frontend and backend run on the same server
 */
export function getLocalBackendUrl(baseUrl: string | undefined): string {
  if (!baseUrl) return 'http://localhost:8080/graphql';
  
  // For production, convert HTTPS domain to HTTP localhost
  if (baseUrl.startsWith('https://')) {
    return 'http://localhost:8080/graphql';
  }
  
  // For development, use the provided base URL
  if (baseUrl.startsWith('http://')) {
    return `${baseUrl}/graphql`;
  }
  
  return 'http://localhost:8080/graphql';
}

/**
 * Get the GraphQL endpoint URL based on environment
 */
export function getGraphQLEndpoint(): string {
  if (process.env.NODE_ENV === 'production') {
    return getLocalBackendUrl(process.env.NEXT_PUBLIC_API_BASE);
  }
  
  // Development fallback
  return 'http://localhost:5023/graphql';
}