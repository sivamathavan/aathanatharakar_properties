/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Keep lint warnings non-blocking for now; surface them via `npm run lint` locally.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Real type errors should block deployment.
    ignoreBuildErrors: false,
  },
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "*.firebasestorage.app" },
      // Storage emulator during local development
      { protocol: "http", hostname: "127.0.0.1", port: "9199" },
    ],
  },
  async redirects() {
    // Old pages from the single-broker site.
    return [{ source: "/sell-your-property", destination: "/for-agents", permanent: true }];
  },
  async headers() {
    return [
      // The service worker must always be re-checked, or app updates get stuck.
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
      // The Android app. Every version has its own file name, so it can be cached for good.
      {
        source: "/downloads/:file*",
        headers: [
          { key: "Content-Type", value: "application/vnd.android.package-archive" },
          { key: "Content-Disposition", value: "attachment" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
