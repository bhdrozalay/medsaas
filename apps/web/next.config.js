/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  transpilePackages: ['@medsas/utils'],
  experimental: {
    esmExternals: 'loose'
  }
};

module.exports = nextConfig;
