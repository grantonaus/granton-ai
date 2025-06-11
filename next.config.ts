// next.config.ts
import { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  reactStrictMode: false,
  // Allow your PDF parser only on the server:
  serverExternalPackages: [
    'pdf-parse',
    'cheerio',
    '@prisma/client',  // server-only
  ],

  // If you have any experimental flags, keep them here:
  experimental: {
    // e.g. scrollRestoration: true,
  },

  // You no longer need to set swcMinify (it's always on in 15+)
  // And serverActions has been removed—Next.js auto-configures body limits.
};

export default nextConfig;
