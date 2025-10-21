import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Dev-only CORS headers to allow cross-origin asset and API access from custom local domains
export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  if (process.env.NODE_ENV !== 'production') {
    const origin = req.headers.get('origin') || '*';
    const isLocalCustomDomain = /(^|\.)glasscodeacademy\.local(?::\d+)?$/.test(origin.replace(/^https?:\/\//, ''));

    const allowOrigin = isLocalCustomDomain ? origin : '*';

    res.headers.set('Access-Control-Allow-Origin', allowOrigin);
    res.headers.set('Vary', 'Origin');
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  }

  // Handle preflight in dev to avoid noisy console warnings
  if (process.env.NODE_ENV !== 'production' && req.method === 'OPTIONS') {
    const preflight = new NextResponse(null, { status: 204 });
    const origin = req.headers.get('origin') || '*';
    const isLocalCustomDomain = /(^|\.)glasscodeacademy\.local(?::\d+)?$/.test(origin.replace(/^https?:\/\//, ''));
    const allowOrigin = isLocalCustomDomain ? origin : '*';

    preflight.headers.set('Access-Control-Allow-Origin', allowOrigin);
    preflight.headers.set('Vary', 'Origin');
    preflight.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    preflight.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    return preflight;
  }

  return res;
}

export const config = {
  matcher: '/:path*',
};