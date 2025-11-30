import type { NextConfig } from "next";
import { networkInterfaces } from "os";
// Gunakan import default
import withPWAInit from "@ducanh2912/next-pwa";

// Auto-detect Local IP (Agar bisa tes PWA di HP via WiFi)
const getLocalIp = () => {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
};
const localIp = getLocalIp();

// Konfigurasi PWA
const withPWA = withPWAInit({
  dest: "public",
  register: true,
  // Matikan PWA di dev mode agar tidak caching agresif saat coding
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    // Strategi Caching Kustom
    runtimeCaching: [
      // 1. Cache Model AI (Wajib untuk Klasifikasi Offline)
      {
        urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith("/model/"),
        handler: "CacheFirst",
        options: {
          cacheName: "ai-model-cache",
          expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 }, // 1 Tahun
        },
      },
      // 2. Cache API Edukasi (Untuk Baca Offline)
      {
        urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith("/api/education/public"),
        handler: "NetworkFirst", // Coba ambil baru, kalau offline ambil cache
        options: {
          cacheName: "education-api-cache",
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 }, // 1 Hari
        },
      },
      // 3. Cache Gambar (Cloudinary & Next Image)
      {
        urlPattern: ({ url }: { url: URL }) => url.hostname.includes("cloudinary") || url.pathname.startsWith("/_next/image"),
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "images-cache",
          expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  // Header Cache untuk Model (Server Side)
  async headers() {
    return [
      {
        source: "/model/:all*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  async rewrites() {
    return [{ source: "/api/inngest", destination: "/api/inngest" }];
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
    formats: ["image/webp", "image/avif"],
  },
  // Izinkan akses dari HP (Network IP)
  allowedDevOrigins: ["localhost:3000", `${localIp}:3000`],
};

export default withPWA(nextConfig);
