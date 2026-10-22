import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://*.googlesyndication.com https://*.google.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://cm.g.doubleclick.net https://tpc.googlesyndication.com https://*.googlesyndication.com https://*.google.com",
      "font-src 'self' data:",
      "connect-src 'self' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net",
      "frame-src https://tpc.googlesyndication.com https://googleads.g.doubleclick.net https://*.googlesyndication.com https://*.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
  },
  allowedDevOrigins: ["dock-cloth-hats-theory.trycloudflare.com"],
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
