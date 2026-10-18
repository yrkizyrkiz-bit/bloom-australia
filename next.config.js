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

/**
 * Security headers applied to every response. Netlify's `[[headers]]` block is not
 * applied to routes served by the Next.js runtime, so they must live here.
 * CSP is limited to frame-ancestors (clickjacking) — a full script CSP needs
 * nonces for Stripe/Meta/Next inline scripts and is tracked separately.
 */
const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  // HSTS and upgrade-insecure-requests force the browser onto HTTPS. The dev
  // server is HTTP-only, so those directives make Safari drop CSS, JS and images.
  ...(isDev
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
  // SAMEORIGIN rather than DENY so the CSP frame-ancestors list below is authoritative
  // (X-Frame-Options has no allow-list; browsers prefer CSP when both are present).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      'camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=(), payment=(self "https://js.stripe.com" "https://checkout.stripe.com")',
  },
  {
    key: "Content-Security-Policy",
    // Google's search-result site preview embeds the page from google.com domains.
    value: [
      "frame-ancestors 'self' https://www.google.com https://www.google.com.au https://*.google.com",
      isDev ? null : "upgrade-insecure-requests",
    ]
      .filter(Boolean)
      .join("; "),
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: lanDevOrigins(),
  poweredByHeader: false,
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
        source: "/:path*",
        headers: securityHeaders,
      },
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
    // Enable Next.js image optimisation (WebP/AVIF, sizing). Required for production perf.
    unoptimized: false,
    formats: ["image/avif", "image/webp"],
    qualities: [75, 95],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
