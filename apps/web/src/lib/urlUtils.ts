/**
 * Utility functions for URL handling
 */

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
    const apiBase = process.env.NEXT_PUBLIC_API_BASE?.trim()?.replace(
      /\/+$/,
      ''
    );
    if (apiBase) return `${apiBase}${path}`;

    try {
      return `${getPublicOriginStrict()}${path}`;
    } catch {
      try {
        return `${getApiBaseStrict()}${path}`;
      } catch {
        // Explicitly signal misconfiguration on server-side usage
        throw new Error(
          'GraphQL endpoint configuration missing. Set NEXT_PUBLIC_API_BASE or NEXT_PUBLIC_BASE_URL/VERCEL_URL.'
        );
      }
    }
  }

  // In the browser a relative URL is fine and proxied by `/graphql` rewrite.
  return path;
}

/** Strictly derive the public origin from env; throws if not configured. */
export function getPublicOriginStrict(): string {
  const base = (
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  ).replace(/\/+$/, '');
  if (!base)
    throw new Error(
      'Base URL not configured. Set NEXT_PUBLIC_BASE_URL or VERCEL_URL.'
    );
  return base;
}

/** Strictly derive API base from env; throws if not configured. */
export function getApiBaseStrict(): string {
  // Read raw value
  let base = (process.env.NEXT_PUBLIC_API_BASE || '').trim();
  // Remove quotes/backticks
  base = base.replace(/[`'\"]/g, '');
  // Trim whitespace
  base = base.trim();
  // Strip trailing punctuation (commas, colons, semicolons)
  base = base.replace(/[,:;]+$/, '');
  // Remove trailing slashes
  base = base.replace(/\/+$/, '');
  // Ensure scheme
  if (base && !/^https?:\/\//.test(base)) {
    base = `https://${base}`;
  }
  if (!base)
    throw new Error('API base not configured. Set NEXT_PUBLIC_API_BASE.');
  return base;
}
