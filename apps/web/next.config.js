/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  transpilePackages: ['@medsas/utils'],
  experimental: {
    esmExternals: 'loose'
  },
  output: 'standalone',
  // Include src directory in production build
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, module: false };
    }
    return config;
  }
};

module.exports = nextConfig;
