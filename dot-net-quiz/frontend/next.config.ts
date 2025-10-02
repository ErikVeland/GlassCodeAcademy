import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
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
  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Reduce bundle size by excluding unnecessary modules
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
      };
    }
    
    return config;
  },
  // Enable compression
  compress: true,
  // Enable React Server Components
  reactStrictMode: true,
};

export default nextConfig;