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
