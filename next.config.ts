import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: "/api/inngest",
        destination: "/api/inngest",
      },
    ];
  },
};

export default nextConfig;
