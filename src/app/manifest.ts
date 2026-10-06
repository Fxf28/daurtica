import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daurtica - Platform Pengelolaan Sampah Berbasis AI",
    short_name: "Daurtica",
    description: "Klasifikasi sampah otomatis dengan AI dan edukasi pengelolaan sampah",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    orientation: "portrait",
    id: "/",
    scope: "/",
    lang: "id",
    categories: ["education", "environment", "productivity"],
    // `purpose: "any maskable"` (combined token) is not part of Next's
    // MetadataRoute.Manifest Icon type, so it is expressed spec-equivalently
    // as paired entries with a single purpose token each.
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
