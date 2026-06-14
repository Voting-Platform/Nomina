import type { NextConfig } from "next";

// HTTP security headers applied to every response.
// What each one does:
//   X-Frame-Options DENY          — blocks other sites embedding this app in an iframe (clickjacking)
//   X-Content-Type-Options nosniff — stops browsers guessing file types (MIME sniffing attacks)
//   Referrer-Policy               — limits how much of the URL leaks when navigating away
//   Permissions-Policy            — disables browser APIs this app never uses (camera, mic, location)
//   X-XSS-Protection              — legacy XSS filter for old browsers
//   Content-Security-Policy       — restricts which scripts/styles/images the browser may load
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js App Router requires unsafe-inline for inline scripts/styles
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      // Cloudinary for candidate images; Google for profile photos
      "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com",
      "font-src 'self'",
      // API calls: own origin + Cloudinary upload endpoint
      "connect-src 'self' https://*.cloudinary.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
