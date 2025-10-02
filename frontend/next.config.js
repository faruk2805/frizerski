/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['tailwindcss'],
  },
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;
