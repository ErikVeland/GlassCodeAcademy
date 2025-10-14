/**
 * Utility functions for URL handling
 */

/**
 * Get the GraphQL endpoint URL with no hardcoded host.
 *
 * - If `GRAPHQL_ENDPOINT` is set, use it verbatim.
 * - Otherwise, always use the relative `/graphql` route, which the app proxies.
 */
export function getGraphQLEndpoint(): string {
  const explicitEndpoint = process.env.GRAPHQL_ENDPOINT?.trim();
  if (explicitEndpoint) return explicitEndpoint;
  const path = '/graphql';
  // On the server, a relative URL like '/graphql' will throw ERR_INVALID_URL.
  // Derive an absolute URL using public origin or API base.
  if (typeof window === 'undefined') {
    try {
      const origin = getPublicOriginStrict();
      return `${origin}${path}`;
    } catch {
      try {
        const apiBase = getApiBaseStrict();
        return `${apiBase}${path}`;
      } catch {
        // Final fallback; returning relative will likely fail on server.
        return path;
      }
    }
  }
  // In the browser a relative URL is fine and proxied by /app/graphql route.
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