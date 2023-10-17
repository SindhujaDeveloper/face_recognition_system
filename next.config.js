/** @type {import('next').NextConfig} */

module.exports = {
    // Other config options
    async rewrites() {
      return [
        {
          source: '/models/:path*',
          destination: '/models/:path*',
        },
      ];
    },
  };