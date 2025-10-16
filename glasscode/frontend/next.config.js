/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // Enable optimizations for faster builds
    optimizeCss: true,
  },
  // Ensure static assets are properly handled
  assetPrefix: undefined,
  // Configure for production deployment
  poweredByHeader: false,
  compress: true,
  // Handle trailing slashes consistently
  trailingSlash: false,
  // Optimize build performance
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Reduce bundle analysis overhead
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Optimize for production builds
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
            priority: 0,
          },
        },
      };
    }
    return config;
  },
}

module.exports = nextConfig