/** @type {import('next').NextConfig} */

const isMobile = process.env.BUILD_TARGET === 'mobile';

const defaultConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
    ],
  },
};

const mobileConfig = {
  ...defaultConfig,
  output: 'export',
};

module.exports = isMobile ? mobileConfig : defaultConfig;
