/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // ✅ CSP that permits Next.js hydration & our inline styles
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",  // allow Next inline boot script
              "style-src 'self' 'unsafe-inline'",   // allow React inline style props
              "img-src 'self' data:",
              "connect-src 'self'",                 // proxy is same-origin (/api/proxy/*)
              "font-src 'self' data:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "object-src 'none'"
            ].join("; ")
          }
        ]
      }
    ];
  }
};
module.exports = nextConfig;
