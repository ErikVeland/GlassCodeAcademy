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
  // Prefer explicit GraphQL endpoint when provided. Works in SSR and browser.
  const explicitEndpoint = process.env.GRAPHQL_ENDPOINT?.trim();
  if (explicitEndpoint) {
    return explicitEndpoint;
  }

  const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  const rawApiBase = process.env.NEXT_PUBLIC_API_BASE?.trim();

  const baseUrl = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, '') : undefined;
  const apiBase = rawApiBase ? rawApiBase.replace(/\/+$/, '') : undefined;

  if (process.env.NODE_ENV === 'production') {
    if (baseUrl && (baseUrl.startsWith('https://') || baseUrl.startsWith('http://'))) {
      // Enforce HTTPS scheme in production if http is provided
      const httpsBase = baseUrl.startsWith('http://')
        ? `https://${baseUrl.slice('http://'.length)}`
        : baseUrl;
      return `${httpsBase}/graphql`;
    }
    // Fallback: relative path for browser (proxied by Nginx)
    return '/graphql';
  }

  // Development environment: if NEXT_PUBLIC_API_BASE is set, proxy via relative path
  // This allows Next.js rewrites to avoid CORS issues in dev
  if (apiBase) {
    return '/graphql';
  }

  // Default dev fallback
  // Backend default port is 8080 per backend README/start-dev.sh
  return 'http://127.0.0.1:8080/graphql';
}