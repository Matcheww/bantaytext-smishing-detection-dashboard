import type { NextConfig } from "next";

const securityHeaders = [
  // Prevents the browser from guessing content types away from what the
  // server declares — mitigates some XSS/MIME-confusion attacks.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Blocks this site from being embedded in an <iframe> anywhere, which
  // prevents clickjacking attacks against the Analyze page's submit button.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // This app doesn't use the camera, microphone, or geolocation — deny them
  // explicitly rather than leaving the default (often permissive) policy.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Only takes effect over HTTPS; harmless (ignored) over plain HTTP in dev.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-inline' is required here because Next.js's App Router
      // injects inline hydration scripts/styles at runtime. A stricter,
      // nonce-based CSP is possible via Next.js middleware but adds real
      // implementation complexity (threading a per-request nonce through
      // every script/style tag) — noted as a follow-up rather than silently
      // left out.
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      // The browser only ever calls same-origin API routes; the actual
      // inference service is called server-side from the Next.js backend,
      // never directly from client JS, so no external connect-src is needed.
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
