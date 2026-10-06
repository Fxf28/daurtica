// src/components/pwa-update-banner.tsx
"use client";

import { RefreshCw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useServiceWorkerUpdate } from "@/hooks/use-service-worker-update";

/**
 * Banner pembaruan Service Worker (Phase 8).
 *
 * - Muncul HANYA saat `updateAvailable === true` dan belum di-"Nanti"-kan.
 * - Tidak dirender saat SSR / render pertama klien (state awal tidak pernah
 *   `update-available`), jadi tidak ada hydration mismatch dan tidak muncul
 *   pada first load normal maupun di browser tanpa dukungan service worker.
 * - Non-modal & tidak memblokir aplikasi: elemen fixed kecil di bawah layar,
 *   tanpa overlay dan tanpa focus trap. Fokus tidak dibajak saat banner
 *   muncul (tidak ada auto-focus yang mengganggu); kedua tombol adalah
 *   `<button>` native dengan focus ring design system, dapat dijangkau
 *   keyboard lewat urutan tab normal (banner dirender setelah konten halaman).
 * - Aksi:
 *     "Perbarui sekarang" → `update()` (alur reload terkendali + guard)
 *     "Nanti" / tombol tutup → `dismiss()` (hanya menyembunyikan banner)
 *
 * Dipasang sekali di root layout (src/app/layout.tsx) agar tersedia di semua
 * route, terpisah sepenuhnya dari install prompt Phase 7.
 */
export function PwaUpdateBanner() {
  const { updateAvailable, dismissed, update, dismiss } =
    useServiceWorkerUpdate();

  if (!updateAvailable || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      className="fixed inset-x-4 z-[1100] mx-auto max-w-md rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-background/80 sm:inset-x-auto sm:right-4 sm:mx-0 sm:w-96"
    >
      <div className="flex items-start gap-3">
        <RefreshCw
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-primary"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Versi baru tersedia
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Daurtica memiliki pembaruan baru. Muat ulang untuk menggunakan versi
            terbaru.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Tutup notifikasi pembaruan"
          className="-mr-1 -mt-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={dismiss}>
          Nanti
        </Button>
        <Button type="button" size="sm" onClick={update}>
          Perbarui sekarang
        </Button>
      </div>
    </div>
  );
}
