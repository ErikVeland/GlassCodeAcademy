// Shared utility to detect network-related errors across pages
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  // Check common network error patterns
  const base: Record<string, unknown> =
    typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : {};

  const networkError: Record<string, unknown> | undefined =
    typeof base["networkError"] === 'object' && base["networkError"] !== null
      ? (base["networkError"] as Record<string, unknown>)
      : undefined;

  const statusCandidate = [
    base["status"],
    base["statusCode"],
    networkError?.["status"],
    networkError?.["statusCode"],
  ].find((v): v is number => typeof v === 'number');

  const rawMessage = base["message"];
  const message: string =
    typeof rawMessage === 'string' ? rawMessage : rawMessage != null ? String(rawMessage) : '';
  const status: number | undefined = statusCandidate;

  const msg = message.toLowerCase();
  const messageHints = [
    'failed to fetch',
    'networkerror',
    'econnrefused',
    'econnreset',
    'timeout',
    'timed out',
    'etimedout',
    'econnaborted',
    'bad gateway',
    'service unavailable',
    'gateway timeout',
    'request timeout',
    'dns',
    'enotfound',
    'eai_again',
  ];

  const statusIndicatesNetwork = typeof status === 'number' && (status === 408 || status >= 500);
  const messageHasHttpCodes = /\b(408|500|502|503|504)\b/.test(message);

  return (
    statusIndicatesNetwork ||
    messageHasHttpCodes ||
    messageHints.some(h => msg.includes(h)) ||
    !!networkError
  );
}