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
    // Enable faster refresh
    optimizeCss: true,
  },
  // Optimize dev server - keep pages in memory longer to reduce recompilation
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 300 * 1000, // Increased to 5 minutes
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 25, // Increased to 25 pages
  },
  // Optimize bundle splitting
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude server-only packages from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };

      // Exclude mysql2 and other server-only packages from client bundle
      // Only add externals if it's an array, otherwise create one
      if (Array.isArray(config.externals)) {
        config.externals.push({
          'mysql2': 'commonjs mysql2',
          'mysql2/promise': 'commonjs mysql2/promise',
        });
      } else if (config.externals) {
        // If externals is a function or object, wrap it
        const originalExternals = config.externals;
        config.externals = [
          originalExternals,
          {
            'mysql2': 'commonjs mysql2',
            'mysql2/promise': 'commonjs mysql2/promise',
          }
        ];
      } else {
        config.externals = [
          {
            'mysql2': 'commonjs mysql2',
            'mysql2/promise': 'commonjs mysql2/promise',
          }
        ];
      }

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
