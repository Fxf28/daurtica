"use client";

import { WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";

// Halaman fallback offline (Phase 6).
//
// - Next.js merender halaman ini sebagai dokumen statis (diprerender saat build),
//   lalu plugin @ducanh2912/next-pwa menambahkan `/~offline` ke precache manifest
//   + fallback worker (auto-deteksi `src/app/~offline/page.tsx`).
// - Service worker mengarahkan navigasi dokumen yang gagal ke halaman ini
//   (lihat next.config.ts aturan dokumen + docs/pwa-offline.md).
// - Sengaja TIDAK memakai API, database, Clerk, model AI, gambar/font
//   eksternal, atau resource jaringan lain. Hanya komponen lokal yang
//   sudah ikut ter-precache bersama dokumen ini.
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-card-foreground shadow-sm">
        <WifiOff aria-hidden="true" className="mx-auto size-12 text-muted-foreground" />

        <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
          Kamu sedang offline
        </h1>

        <p className="mt-3 text-muted-foreground">
          Periksa koneksi internetmu dan coba lagi.
        </p>

        <Button
          type="button"
          size="lg"
          className="mt-8"
          onClick={() => window.location.reload()}
        >
          Coba lagi
        </Button>
      </div>
    </main>
  );
}
