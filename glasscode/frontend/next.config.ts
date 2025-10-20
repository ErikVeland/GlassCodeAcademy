import type { NextConfig } from "next";

const IS_PROD = process.env.NODE_ENV === 'production';

const cspBase = [
  "default-src 'self'",
  // Allow Next.js runtime chunks and inline loader in production; keep dev permissive
  IS_PROD
    ? "script-src 'self' https: blob: 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' http: https: blob:",
  // Styles: allow inline styles for Next and Tailwind in both envs
  IS_PROD
    ? "style-src 'self' https: 'unsafe-inline'"
    : "style-src 'self' 'unsafe-inline' https:",
  "img-src 'self' data: blob: https:",
  IS_PROD
    ? "connect-src 'self' https: wss:"
    : "connect-src 'self' http: https: ws: wss:",
  "font-src 'self' https: data:",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

const cspReportOnly = IS_PROD
  ? [
      "default-src 'self'",
      "script-src 'self' https: blob: 'unsafe-inline'",
      "style-src 'self' https: 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https: wss:",
      "font-src 'self' https: data:",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join('; ')
  : cspBase;

const nextConfig: NextConfig = {
  eslint: {
    // Enforce ESLint during production builds so invalid code fails early
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Explicitly fail the build on TypeScript errors
    ignoreBuildErrors: false,
  },
  // Enable standalone output for production deployment
  output: 'standalone',
  // Performance optimizations: disable experimental flags causing export worker issues
  experimental: {
    optimizeCss: false,
    // Remove optimizePackageImports to avoid bundler chunk resolution problems
  },
  // Image optimization
  images: {
    minimumCacheTTL: 86400,
    formats: ['image/avif', 'image/webp'],
  },
  // Enable compression
  compress: true,
  // Enable React Server Components
  reactStrictMode: true,
  // Dev proxy: forward frontend `/graphql` to backend GraphQL API
  async rewrites() {
    // Prefer configured API base if provided; otherwise default to local backend
    const base = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, '') || 'http://127.0.0.1:8080';
    return [
      {
        source: '/graphql',
        destination: `${base}/graphql`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          // Enforced CSP (dev allows inline styles/scripts to support Next dev)
          { key: 'Content-Security-Policy', value: cspBase },
          // Only send report-only in production, and include a report-to directive
          // to avoid browser warnings. Dev omits to reduce console noise.
          ...(
            IS_PROD
              ? [
                  { key: 'Report-To', value: '{"group":"default","max_age":10886400,"endpoints":[{"url":"/api/csp-report"}]}' },
                  { key: 'Content-Security-Policy-Report-Only', value: `${cspReportOnly}; report-to default` },
                ]
              : []
          ),
        ],
      },
    ];
  },
};

export default nextConfig;