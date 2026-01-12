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
  ...(IS_PROD ? ["upgrade-insecure-requests", "report-to csp-endpoint"] : []),
].join('; ');

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
  // Security and performance: disable the X-Powered-By header
  poweredByHeader: false,
  // Do not ship browser source maps in production
  productionBrowserSourceMaps: false,
  // Keep Node HTTP connections alive to improve SSR fetch performance
  httpAgentOptions: {
    keepAlive: true,
  },
  // Remove console logs in production builds except errors and warnings
  compiler: {
    removeConsole: IS_PROD ? { exclude: ['error', 'warn'] } : false,
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
  // Configure Sass options
  sassOptions: {
    // Silence deprecation warnings
    silenceDeprecations: ['legacy-js-api'],
  },
  // Dev proxy: forward frontend `/graphql` to backend GraphQL API
  async rewrites() {
    // Prefer configured API base if provided; otherwise default to local backend
const base = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, '') || 'http://127.0.0.1:8081';
    return {
      // Ensure NextAuth routes are handled by Next.js and NOT proxied
      beforeFiles: [
        {
          source: '/api/auth/:path*',
          destination: '/api/auth/:path*',
        },
        // Ensure content quiz and registry routes are served by Next and not proxied
        {
          source: '/api/content/registry',
          destination: '/api/content/registry',
        },
        {
          source: '/api/content/quizzes/:slug',
          destination: '/api/content/quizzes/:slug',
        },
      ],
      // Proxy other API routes to the backend after filesystem routes are checked
      afterFiles: [
        {
          source: '/graphql',
          destination: `${base}/graphql`,
        },
      ],
      fallback: [],
    };
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          ...(IS_PROD
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }]
            : []
          ),
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          ...(IS_PROD
            ? [
                {
                  key: 'Report-To',
                  value:
                    '{"group":"csp-endpoint","max_age":10800,"endpoints":[{"url":"/api/csp-report"}]}'
                },
                {
                  key: 'Reporting-Endpoints',
                  value: 'csp-endpoint="/api/csp-report"'
                }
              ]
            : []
          ),
          // Enforced CSP (dev allows inline styles/scripts to support Next dev)
          { key: 'Content-Security-Policy', value: cspBase }
        ],
      },
    ];
  },
};

export default nextConfig;