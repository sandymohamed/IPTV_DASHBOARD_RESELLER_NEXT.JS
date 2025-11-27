/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    emotion: true,
  },
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
    // Optimize dev compilation
    turbo: {
      resolveAlias: {
        // Optimize common imports
      },
    },
  },
  // Optimize dev server
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Optimize bundle splitting
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk for MUI
          mui: {
            name: 'mui',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](@mui|@emotion)[\\/]/,
            priority: 30,
            reuseExistingChunk: true,
          },
          // Vendor chunk for icons
          icons: {
            name: 'icons',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]@mui[\\/]icons-material[\\/]/,
            priority: 25,
            reuseExistingChunk: true,
          },
          // Vendor chunk for other libraries
          lib: {
            name: 'lib',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 20,
            reuseExistingChunk: true,
          },
          // Common chunk
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };
    }
    return config;
  },
  // Ensure service worker is served correctly
  async headers() {
    return [
      {
        source: '/service-worker.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
