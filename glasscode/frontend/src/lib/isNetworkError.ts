// Shared utility to detect network-related errors across pages
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  // Check common network error patterns
  const message = (error as { message?: string }).message || '';
  const hasNetworkErrorProp = !!(error as { networkError?: unknown }).networkError;

  return (
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.includes('ECONNREFUSED') ||
    message.toLowerCase().includes('timeout') ||
    message.includes('ECONNRESET') ||
    hasNetworkErrorProp
  );
}