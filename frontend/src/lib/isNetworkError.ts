// Shared utility to detect network-related errors across pages
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  // Normalize error and extract known fields
  const e = error as {
    message?: string;
    networkError?: unknown;
    status?: number;
    response?: { status?: number };
  };

  const m = (e.message || '').toLowerCase();
  const status =
    (typeof e.status === 'number' ? e.status : undefined) ??
    (typeof e.response?.status === 'number' ? e.response.status : undefined);

  // Status-based network hints: 408 Request Timeout, and any 5xx
  const statusIsNetworky = typeof status === 'number' && (status === 408 || (status >= 500 && status < 600));

  // Message-based network hints
  const messageIsNetworky = (
    m.includes('failed to fetch') ||
    m.includes('networkerror') ||
    m.includes('econnrefused') ||
    m.includes('timeout') ||
    m.includes('timed out') ||
    m.includes('econnreset') ||
    m.includes('econnaborted') ||
    m.includes('etimedout') ||
    m.includes('temporarily unavailable') ||
    m.includes('bad gateway') || // 502
    m.includes('service unavailable') || // 503
    m.includes('gateway timeout') || // 504
    m.includes('502') ||
    m.includes('503') ||
    m.includes('504')
  );

  return !!(e.networkError) || statusIsNetworky || messageIsNetworky;
}