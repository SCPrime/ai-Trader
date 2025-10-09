/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Rewrites disabled - using API route handler in pages/api/proxy/[...path].ts instead
  // which properly adds authentication headers
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/proxy/:path*',
  //       destination: 'http://localhost:8000/api/:path*',
  //     },
  //   ];
  // },
  async headers() {
    // Content Security Policy - allows data: URIs for SVG/images
    const ContentSecurityPolicy = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net;
      style-src 'self' 'unsafe-inline';
      connect-src 'self' http://localhost:8000 http://localhost:8001 http://127.0.0.1:8001 https://api.anthropic.com https://ai-trader-86a1.onrender.com wss://ai-trader-86a1.onrender.com;
      img-src 'self' data: blob: https:;
      font-src 'self' data:;
      object-src 'self' data:;
      frame-src 'self';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s+/g, ' ').trim();

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: ContentSecurityPolicy }
        ]
      }
    ];
  }
};
module.exports = nextConfig;
