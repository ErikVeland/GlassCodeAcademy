// Shared HTTP utilities: safe JSON parsing, data unwrapping, retries, and debug logging
// These helpers reduce duplication and normalize backend envelopes across routes.

export type ParsedBody = unknown;

export function safeJsonParse(text: string): ParsedBody | null {
  try {
    const trimmed = (text || '').trim();
    if (!trimmed) return null;
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

// Unwrap common backend envelopes that place payload under `data`
export function unwrapData<T = unknown>(value: unknown): T | unknown {
  if (value && typeof value === 'object') {
    const maybe = value as { data?: unknown };
    if (Object.prototype.hasOwnProperty.call(maybe, 'data')) {
      return (maybe.data as T) ?? null;
    }
  }
  return value as T;
}

export interface ProxyJsonResult<T = unknown> {
  status: number;
  contentType?: string;
  body: T | null;
  raw: unknown; // original parsed value before unwrapping
}

export async function proxyJsonResponse<T = unknown>(res: Response): Promise<ProxyJsonResult<T>> {
  const status = res.status;
  const contentType = res.headers.get('content-type') || undefined;
  const text = await res.text();
  const parsed = safeJsonParse(text);
  const unwrapped = unwrapData<T>(parsed);
  return {
    status,
    contentType,
    body: (unwrapped as T) ?? null,
    raw: parsed,
  };
}

// Simple bounded retry with backoff for transient failures (e.g., 5xx)
export async function retryFetch(
  url: string,
  options: RequestInit & { cache?: RequestCache } = {},
  attempts = 3,
  backoffMs = 300,
  shouldRetry?: (res: Response, error?: unknown) => boolean,
): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i < Math.max(1, attempts); i++) {
    try {
      const res = await fetch(url, options);
      if (!shouldRetry) {
        if (res.status >= 500) {
          // transient server error, consider retry
          if (i < attempts - 1) await sleep(backoffMs * (i + 1));
          else return res;
        } else {
          return res;
        }
      } else {
        const retry = shouldRetry(res);
        if (retry && i < attempts - 1) {
          await sleep(backoffMs * (i + 1));
          continue;
        }
        return res;
      }
    } catch (e) {
      lastError = e;
      // network failure, retry if attempts remain
      if (i < attempts - 1) await sleep(backoffMs * (i + 1));
      else throw e;
    }
  }
  // Should be unreachable; throw last error if any
  throw lastError ?? new Error('retryFetch failed without specific error');
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Gate debug logs behind env flags to reduce noise
export function debugLog(...args: unknown[]) {
  const isDev = process.env.NODE_ENV !== 'production';
  const enabled = (process.env.NEXT_PUBLIC_DEBUG || '').toLowerCase() === 'true';
  if (isDev && enabled) {
    console.log('[dev]', ...args);
  }
}