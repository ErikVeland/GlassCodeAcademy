// Shared utility to detect network-related errors, compatible with ApolloError and generic errors
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  if (typeof error === 'object' && error !== null) {
    const anyErr = error as { message?: string; networkError?: unknown } & Record<string, unknown>;
    const msg = anyErr.message;
    if (typeof msg === 'string') {
      const m = msg.toLowerCase();
      if (
        m.includes('failed to fetch') ||
        m.includes('networkerror') ||
        m.includes('econnrefused') ||
        m.includes('timeout')
      ) {
        return true;
      }
    }
    if (anyErr.networkError) {
      return true;
    }
  }

  return false;
}