import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// What the browser may load. Only our own site, plus the Google Maps embed on the Contact page.
// 'unsafe-inline' for scripts is required by Next.js page hydration without per-request nonces;
// everything else (other sites' scripts, plugins, being framed by other sites) is blocked.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src https://maps.google.com https://www.google.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  serverExternalPackages: ["@electric-sql/pglite", "exceljs"],
  experimental: {
    // Keep static generation within the memory available in local and hosted build workers.
    cpus: 1,
    // Worker forms carry up to 5 scanned documents of 5 MB each; the default 1 MB would reject real scans.
    serverActions: { bodySizeLimit: "26mb" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self), payment=(), usb=()" },
        ],
      },
      {
        // Logged-in pages must never be stored by shared caches or the browser's back-forward cache.
        source: "/(admin|portal|account)/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};

export default nextConfig;
