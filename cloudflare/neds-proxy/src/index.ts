type CFExecutionContext = {
  waitUntil(promise: Promise<any>): void
  passThroughOnException?: () => void
}

export default {
  async fetch(request: Request, env: Record<string, unknown>, ctx: CFExecutionContext): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders('*'),
      })
    }

    try {
      const url = new URL(request.url)

      // Normalize incoming path: allow calls via '/api/...'
      // so '/api/rest/v1/racing' becomes '/rest/v1/racing'
      const incomingPath = url.pathname.startsWith('/api/')
        ? url.pathname.replace(/^\/api/, '')
        : url.pathname

      // Map any path under this Worker to Neds upstream
      // Expect calls like: /rest/v1/racing/?method=nextraces&count=10
      const upstream = new URL('https://api.neds.com.au' + incomingPath)
      upstream.search = url.search // preserve query string

      const res = await fetch(upstream.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          // Provide same-origin context signals; upstream may ignore these but they help
          'Origin': 'https://bet.glasscode.academy',
          'Referer': 'https://bet.glasscode.academy/',
          // Avoid caches serving stale content
          'Cache-Control': 'no-cache',
        },
        // Light caching to reduce upstream pressure
        // @ts-expect-error Cloudflare-specific property
        cf: { cacheTtl: 15, cacheEverything: true },
      })

      const body = await res.text()
      const headers = new Headers(res.headers)
      // Ensure CORS is permitted from our site (or broadly during testing)
      const allowOrigin = '*' // replace with 'https://bet.glasscode.academy' for production
      corsHeaders(allowOrigin).forEach((value, key) => headers.set(key, value))
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
  h.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  h.set('Access-Control-Max-Age', '86400')
  return h
}