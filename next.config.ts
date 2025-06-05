// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
    // This setting raises the limit for Server Actions / API routes
    serverActions: {
      bodySizeLimit: '20mb', // or however large you expect your PDFs to be
    },
  },
};

module.exports = nextConfig;