import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Legacy moduleSlug -> shortSlug mapping (kept in sync with contentRegistry)
const moduleSlugToShortSlug: Record<string, string> = {
  'programming-fundamentals': 'programming',
  'web-fundamentals': 'web',
  'version-control': 'version',
  'dotnet-fundamentals': 'dotnet',
  'react-fundamentals': 'react',
  'database-systems': 'database',
  'typescript-fundamentals': 'typescript',
  'node-fundamentals': 'node',
  'laravel-fundamentals': 'laravel',
  'nextjs-advanced': 'nextjs',
  'graphql-advanced': 'graphql',
  'sass-advanced': 'sass',
  'tailwind-advanced': 'tailwind',
  'vue-advanced': 'vue',
  'testing-fundamentals': 'testing',
  'e2e-testing': 'e2e',
  'performance-optimization': 'performance',
  'security-fundamentals': 'security',
};

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

  // Redirect legacy /modules/:moduleSlug paths to canonical shortSlug routes
  const { pathname, search } = new URL(req.url);
  if (pathname.startsWith('/modules/')) {
    const rest = pathname.slice('/modules/'.length);
    const [moduleSlug, ...subpath] = rest.split('/');
    const shortSlug = moduleSlug && moduleSlugToShortSlug[moduleSlug];
    if (shortSlug) {
      const newPath = '/' + [shortSlug, ...subpath].join('/');
      const target = new URL(newPath, req.url);
      target.search = search; // preserve query string
      return NextResponse.redirect(target, 308);
    }
  }

  return res;
}

export const config = {
  matcher: '/:path*',
};