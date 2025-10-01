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
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; connect-src 'self' https://ai-trader-86a1.onrender.com wss://ai-trader-86a1.onrender.com; img-src 'self' data: blob: https:; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
          }
        ]
      }
    ];
  }
};
module.exports = nextConfig;
