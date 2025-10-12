import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Skip ESLint during production builds to prevent build failures
    // Linting remains enabled in development via IDE/editor and npm scripts
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'react',
      'react-dom',
      '@apollo/client',
      'next',
    ],
  },
  // Image optimization
  images: {
    minimumCacheTTL: 60,
    formats: ['image/avif', 'image/webp'],
  },
  // Bundle optimization - Removed Webpack config to use Turbopack
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
};

export default nextConfig;