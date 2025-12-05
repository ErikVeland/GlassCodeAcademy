import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import type { NextRequest } from 'next/server';

const intl = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, '');

  const res = intl(req);

  const csp = [
    "default-src 'self'",
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `script-src 'self' 'nonce-${nonce}'`,
    "font-src 'self' https://fonts.gstatic.com data:",
    "connect-src 'self' https://api.resend.com https://hooks.slack.com",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests'
  ].join('; ');

  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'same-origin');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  res.cookies.set('csp-nonce', nonce, { httpOnly: true, secure: true, sameSite: 'lax' });

  return res;
}

export const config = {
  matcher: ['/', '/(nb|nn|en)/:path*']
};
