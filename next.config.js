const os = require("os");

function lanDevOrigins() {
  const hostname = os.hostname().replace(/\.local$/i, "");
  const origins = new Set([
    "*.preview.same-app.com",
    `${hostname}.local`,
  ]);
  for (const addrs of Object.values(os.networkInterfaces())) {
    for (const addr of addrs || []) {
      if ((addr.family === "IPv4" || addr.family === 4) && !addr.internal) {
        origins.add(addr.address);
      }
    }
  }
  return [...origins];
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: lanDevOrigins(),
  eslint: {
    // Allow production builds to complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even with TypeScript errors
    ignoreBuildErrors: true,
  },
  // Increase body size limit for file uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // CORS headers for cross-origin API requests from promo site
  async headers() {
    return [
      {
        source: "/api/intake",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
      {
        source: "/api/stripe/webhook",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "POST,OPTIONS" },
        ],
      },
      {
        source: "/api/cal-webhook",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "POST,OPTIONS,GET" },
        ],
      },
    ];
  },

  images: {
    unoptimized: true,
    qualities: [75, 95],
    domains: [
      "source.unsplash.com",
      "images.unsplash.com",
      "ext.same-assets.com",
      "ugc.same-assets.com",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ext.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ugc.same-assets.com",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
