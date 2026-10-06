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

// Konfigurasi PWA — kebijakan cache terkontrol (lihat docs/pwa-cache-strategy.md).
//
// Catatan penting:
// - Karena `runtimeCaching` diisi, seluruh default runtime caching dari plugin
//   digantikan (extendDefaultRuntimeCaching default = false). Hanya aturan di
//   bawah ini + route start-url otomatis yang berlaku.
// - Workbox memakai first-match-wins. Urutan berikut sengaja dari yang paling
//   spesifik ke paling luas.
// - Setiap entri hanya match GET kecuali `method` diisi eksplisit (Workbox
//   default route method = GET), sehingga request mutasi tidak pernah masuk
//   jalur caching.
// - `dynamicStartUrl: true` membuat plugin menambahkan route NetworkFirst untuk
//   tepat `/` (landing page publik).
// - Navigasi dokumen lain ditangani aturan (9): NetworkOnly tanpa cache +
//   fallback dokumen ke `/~offline` (halaman `src/app/~offline/page.tsx`
//   dideteksi & di-precache otomatis oleh plugin; lihat docs/pwa-offline.md).
const withPWA = withPWAInit({
  dest: "public",
  register: true,
  // Matikan PWA di dev mode agar tidak caching agresif saat coding
  disable: process.env.NODE_ENV === "development",
  dynamicStartUrl: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    // Strategi Caching Kustom
    runtimeCaching: [
      // 0) GUARD KEAMANAN: semua request mutasi -> NetworkOnly, apa pun host-nya.
      // Diletakkan paling awal agar tidak ada aturan caching yang bisa menangkap
      // POST/PUT/PATCH/DELETE (AI classification, history, admin, Inngest, auth).
      { urlPattern: () => true, method: "POST", handler: "NetworkOnly" },
      { urlPattern: () => true, method: "PUT", handler: "NetworkOnly" },
      { urlPattern: () => true, method: "PATCH", handler: "NetworkOnly" },
      { urlPattern: () => true, method: "DELETE", handler: "NetworkOnly" },

      // 1) Cache Model AI (wajib untuk klasifikasi offline)
      {
        urlPattern: ({ url }) => url.pathname.startsWith("/model/"),
        handler: "CacheFirst",
        options: {
          cacheName: "daurtica-model",
          cacheableResponse: { statuses: [200] },
          expiration: {
            maxEntries: 10, // cukup untuk 5 file model + headroom versi baru
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 tahun
            purgeOnQuotaError: true,
          },
        },
      },
      // 2) Cache gambar Cloudinary — HANYA host exact yang dipakai aplikasi
      //    (secure_url Cloudinary SDK + images.remotePatterns di bawah).
      {
        urlPattern: ({ url }) =>
          url.protocol === "https:" && url.hostname === "res.cloudinary.com",
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "daurtica-cloudinary",
          cacheableResponse: { statuses: [0, 200] }, // 0 = opaque image response
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
            purgeOnQuotaError: true,
          },
        },
      },
      // 3) Cache optimizer gambar Next.js (bukan seluruh /_next/**)
      {
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin && url.pathname === "/_next/image",
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "daurtica-next-image",
          cacheableResponse: { statuses: [200] },
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 hari
            purgeOnQuotaError: true,
          },
        },
      },
      // 4) API edukasi PUBLIK saja: path exact + publishedOnly=true.
      //    Request terautentikasi tanpa flag ini (termasuk draft) tidak pernah
      //    masuk cache — NetworkFirst hanya untuk data publik terbit.
      {
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin &&
          url.pathname === "/api/education/public" &&
          url.searchParams.get("publishedOnly") === "true",
        handler: "NetworkFirst",
        options: {
          cacheName: "daurtica-education-public",
          networkTimeoutSeconds: 5,
          cacheableResponse: { statuses: [200] },
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 1 hari (fallback offline)
            purgeOnQuotaError: true,
          },
        },
      },
      // 5) API bank sampah (publik, read-only GET)
      {
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin && url.pathname.startsWith("/api/waste-banks"),
        handler: "NetworkFirst",
        options: {
          cacheName: "daurtica-waste-banks",
          networkTimeoutSeconds: 5,
          cacheableResponse: { statuses: [200] },
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 1 hari (fallback offline)
            purgeOnQuotaError: true,
          },
        },
      },
      // 6) Dashboard: jangan pernah cache HTML/data privat
      {
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin &&
          (url.pathname === "/dashboard" ||
            url.pathname.startsWith("/dashboard/")),
        handler: "NetworkOnly",
      },
      // 7) Inngest: infrastruktur event, jangan pernah cache
      {
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin && url.pathname.startsWith("/api/inngest"),
        handler: "NetworkOnly",
      },
      // 8) Catch-all API: apa pun yang tidak match aturan publik di atas -> NetworkOnly
      //    (history, classification, education personal/[id]/slug, usage, auth, dll.)
      {
        urlPattern: ({ url, sameOrigin }) =>
          sameOrigin && url.pathname.startsWith("/api/"),
        handler: "NetworkOnly",
      },
      // 9) Dokumen/navigasi halaman: NetworkOnly + fallback dokumen.
      //    TIDAK menambah cache dokumen apa pun. Kehadiran `options` membuat
      //    plugin menyuntikkan handlerDidError -> self.fallback(request):
      //    saat jaringan gagal, navigasi dokumen diarahkan ke `/~offline`
      //    yang sudah di-precache (fallback worker plugin).
      //    Diletakkan setelah aturan /dashboard dan /api/** supaya keduanya
      //    tetap NetworkOnly murni tanpa fallback HTML.
      {
        urlPattern: ({ request, sameOrigin }) =>
          sameOrigin && request.destination === "document",
        handler: "NetworkOnly",
        options: {},
      },
      // 10) Catch-all lintas origin (Clerk/FAPI, 3rd-party): tidak pernah cache.
      //    Cloudinary sudah ditangani aturan (2) di atas, jadi tidak terpengaruh.
      {
        urlPattern: ({ sameOrigin }) => !sameOrigin,
        handler: "NetworkOnly",
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
