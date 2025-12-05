import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import type { NextRequest } from 'next/server';

const intl = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const res = intl(req);

  const csp = [
    "default-src 'self'",
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://api.resend.com https://hooks.slack.com",
    "frame-ancestors 'none'"
  ].join('; ');

  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'same-origin');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');

  return res;
}

export const config = {
  matcher: ['/', '/(nb|nn|en)/:path*']
};
