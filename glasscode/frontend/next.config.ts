import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Enforce ESLint during production builds
    ignoreDuringBuilds: false,
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
};

export default nextConfig;