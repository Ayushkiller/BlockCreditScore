/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async rewrites() {
    return [
      {
        source: '/api/hardhat/:path*',
        destination: 'http://localhost:8545/:path*',
      },
    ];
  },
};

module.exports = nextConfig;