/**
 * Utility functions for URL handling
 */

/**
 * Get the GraphQL endpoint URL based on environment.
 *
 * Production: Prefer absolute public origin from NEXT_PUBLIC_BASE_URL, fallback to
 * relative `/graphql` which is expected to be proxied by Nginx.
 *
 * Development: Use NEXT_PUBLIC_API_BASE if provided, otherwise use localhost fallback.
 */
export function getGraphQLEndpoint(): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, '');
  const apiBase = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, '');

  if (process.env.NODE_ENV === 'production') {
    if (baseUrl && (baseUrl.startsWith('https://') || baseUrl.startsWith('http://'))) {
      return `${baseUrl}/graphql`;
    }
    // Fallback: relative path for browser (proxied by Nginx). Note SSR may require absolute.
    return '/graphql';
  }

  // Development environment: respect configured API base if available
  if (apiBase && (apiBase.startsWith('http://') || apiBase.startsWith('https://'))) {
    return `${apiBase}/graphql`;
  }

  // Default dev fallback
  return 'http://localhost:5023/graphql';
}