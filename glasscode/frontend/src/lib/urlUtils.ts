/**
 * Utility functions for URL handling
 */

// Cache the resolved server-side GraphQL endpoint to avoid repeated env resolution
let SERVER_GRAPHQLEndpoint: string | undefined;

/**
 * Get the GraphQL endpoint URL without hardcoded localhost.
 *
 * - If `GRAPHQL_ENDPOINT` is set, use it verbatim.
 * - Otherwise, prefer relative `/graphql` in the browser (proxied by Next/Nginx).
 * - On the server, derive an absolute URL from `NEXT_PUBLIC_API_BASE` or public origin.
 */
export function getGraphQLEndpoint(): string {
  const explicitEndpoint = process.env.GRAPHQL_ENDPOINT?.trim();
  if (explicitEndpoint) return explicitEndpoint;
  const path = '/graphql';
  // On the server, a relative URL like '/graphql' will throw ERR_INVALID_URL.
  // Derive an absolute URL using API base or public origin.
  if (typeof window === 'undefined') {
    // Return cached value if available
    if (SERVER_GRAPHQLEndpoint) return SERVER_GRAPHQLEndpoint;

    const apiBase = process.env.NEXT_PUBLIC_API_BASE?.trim()?.replace(/\/+$/, '');
    if (apiBase) {
      SERVER_GRAPHQLEndpoint = `${apiBase}${path}`;
      return SERVER_GRAPHQLEndpoint;
    }

    try {
      const origin = getPublicOriginStrict();
      SERVER_GRAPHQLEndpoint = `${origin}${path}`;
      return SERVER_GRAPHQLEndpoint;
    } catch {
      try {
        const fallbackApiBase = getApiBaseStrict();
        SERVER_GRAPHQLEndpoint = `${fallbackApiBase}${path}`;
        return SERVER_GRAPHQLEndpoint;
      } catch {
        // Explicitly signal misconfiguration on server-side usage
        throw new Error('GraphQL endpoint configuration missing. Set NEXT_PUBLIC_API_BASE or NEXT_PUBLIC_BASE_URL/VERCEL_URL.');
      }
    }
  }

  // In the browser a relative URL is fine and proxied by `/graphql` rewrite.
  return path;
}

/** Strictly derive the public origin from env; throws if not configured. */
export function getPublicOriginStrict(): string {
  const base = (process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')).replace(/\/+$/, '');
  if (!base) throw new Error('Base URL not configured. Set NEXT_PUBLIC_BASE_URL or VERCEL_URL.');
  return base;
}

/** Strictly derive API base from env; throws if not configured. */
export function getApiBaseStrict(): string {
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE || '').trim().replace(/\/+$/, '');
  if (!apiBase) throw new Error('API base not configured. Set NEXT_PUBLIC_API_BASE.');
  return apiBase;
}