type CFExecutionContext = {
  waitUntil(promise: Promise<any>): void
  passThroughOnException?: () => void
}

export default {
  async fetch(request: Request, env: Record<string, unknown>, ctx: CFExecutionContext): Promise<Response> {
    // Derive allowed origin from env or hostname; default to strict prod origin
    const reqUrl = new URL(request.url)
    const prodOrigin = (env.ALLOWED_ORIGIN as string) || 'https://bet.glasscode.academy'
    const isWorkersDev = reqUrl.hostname.endsWith('.workers.dev')
    const allowOrigin = isWorkersDev ? '*' : prodOrigin

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(allowOrigin),
      })
    }

    // Only support GET for proxy; reject others explicitly
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ status: 405, message: 'Method Not Allowed' }), {
        status: 405,
        headers: corsHeaders(allowOrigin),
      })
    }

    try {
      const url = reqUrl

      // Normalize incoming path: allow calls via '/api/...'
      // so '/api/rest/v1/racing' becomes '/rest/v1/racing'
      const incomingPath = url.pathname.startsWith('/api/')
        ? url.pathname.replace(/^\/api/, '')
        : url.pathname

      // Map any path under this Worker to Neds upstream
      // Expect calls like: /rest/v1/racing/?method=nextraces&count=10
      const upstream = new URL('https://api.neds.com.au' + incomingPath)
      upstream.search = url.search // preserve query string

      // Compute cache TTL per route
      const ttl = getCacheTtl(incomingPath, upstream.searchParams, (env as Record<string, unknown>)?.DEFAULT_TTL)

      // Build headers for upstream fetch; avoid forwarding sensitive headers
      const upstreamHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        Origin: prodOrigin,
        Referer: prodOrigin + '/',
        // Encourage fresh data at origin; we manage edge caching separately
        'Cache-Control': 'no-cache',
      }

      const res = await fetch(upstream.toString(), {
        method: 'GET',
        headers: upstreamHeaders,
        // Light caching to reduce upstream pressure
        // @ts-expect-error Cloudflare-specific property
        cf: {
          cacheTtl: ttl,
          cacheEverything: true,
          cacheKey: buildCacheKey(url, incomingPath),
        },
      })

      const body = await res.text()
      const headers = new Headers(res.headers)
      // Ensure CORS is permitted from our site (or broadly during testing)
      corsHeaders(allowOrigin).forEach((value, key) => headers.set(key, value))
      headers.set('Vary', 'Origin')
      // Browser caching hint aligned with edge TTL
      headers.set('Cache-Control', `public, max-age=${ttl}`)
      headers.set('Content-Type', 'application/json; charset=utf-8')

      return new Response(body, { status: res.status, headers })
    } catch (err) {
      return new Response(JSON.stringify({ status: 500, message: String(err) }), {
        status: 500,
        headers: corsHeaders('*'),
      })
    }
  },
}

function corsHeaders(origin: string): Headers {
  const h = new Headers()
  h.set('Access-Control-Allow-Origin', origin)
  h.set('Access-Control-Allow-Methods', 'GET,OPTIONS')
  h.set('Access-Control-Allow-Headers', 'Content-Type')
  h.set('Access-Control-Max-Age', '600')
  h.set('Access-Control-Allow-Credentials', 'false')
  return h
}

function getCacheTtl(pathname: string, searchParams: URLSearchParams, envDefaultTtl?: unknown): number {
  // Default TTL from env or 15 seconds
  const parsed = Number(envDefaultTtl)
  const baseTtl = Number.isFinite(parsed) && parsed > 0 ? parsed : 15

  const path = pathname.toLowerCase()
  const method = searchParams.get('method')?.toLowerCase()

  // Extremely volatile endpoints
  if (path.includes('/rest/v1/racing') && (method === 'nextraces' || method === 'nexttoljump')) {
    return 5
  }

  // Moderately volatile: race lists, meetings
  if (path.includes('/rest/v1/racing')) {
    return 15
  }

  // Fallback
  return baseTtl
}

function buildCacheKey(url: URL, normalizedPath: string): string {
  // Normalize query ordering to avoid cache fragmentation
  const params = new URLSearchParams(url.search)
  const sorted = [...params.entries()].sort(([a],[b]) => a.localeCompare(b))
  const normalizedQuery = new URLSearchParams(sorted).toString()
  return `${normalizedPath}?${normalizedQuery}`
}