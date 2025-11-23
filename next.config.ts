import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/inngest",
        destination: "/api/inngest",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },
  allowedDevOrigins: [
    "local-origin.dev", // specific hostname
    "*.local-origin.dev", // wildcard for subdomains
    "192.168.1.9", // a local network IP address
  ],
};
export default nextConfig;
