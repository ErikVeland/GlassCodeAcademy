// Shared utility to detect network-related errors across pages
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  const err = error as any;
  const message: string = (err?.message as string) || '';
  const m = message.toLowerCase();
  const hasNetworkErrorProp = Boolean(err?.networkError);

  // Extract HTTP status if available (fetch/Apollo/custom)
  const status: number | undefined =
    (typeof err?.status === 'number' ? err.status : undefined) ??
    (typeof err?.statusCode === 'number' ? err.statusCode : undefined) ??
    (typeof err?.response?.status === 'number' ? err.response.status : undefined) ??
    (typeof err?.networkError?.status === 'number' ? err.networkError.status : undefined) ??
    (typeof err?.networkError?.statusCode === 'number' ? err.networkError.statusCode : undefined);

  const statusIndicatesNetworkIssue =
    typeof status === 'number' && (status === 408 || (status >= 500 && status <= 599));

  const messageIndicatesNetworkIssue =
    m.includes('failed to fetch') ||
    m.includes('fetch failed') ||
    m.includes('networkerror') ||
    m.includes('econnrefused') ||
    m.includes('econnreset') ||
    m.includes('timeout') ||
    m.includes('timed out') ||
    m.includes('etimedout') ||
    m.includes('service unavailable') ||
    m.includes('bad gateway');

  return hasNetworkErrorProp || statusIndicatesNetworkIssue || messageIndicatesNetworkIssue;
}