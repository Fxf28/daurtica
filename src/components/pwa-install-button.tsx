// src/components/pwa-install-button.tsx
"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

type PwaInstallButtonProps = {
  /** Bentuk kontrol: tombol ringkas (navbar desktop) atau item menu (mobile). */
  variant?: "navbar" | "menu";
  /** Dipanggil saat user memicu alur install (mis. menutup menu mobile). */
  onInstall: () => void;
};

/**
 * Kontrol install PWA — murni presentasional.
 *
 * Visibilitas & state install disuplai oleh `useInstallPrompt()` yang dipanggil
 * sekali di Navbar, supaya hanya ada satu sumber state install per halaman.
 *
 * Aksesibilitas: elemen `<button>` native, nama aksesibel dari label teks
 * ("Install Aplikasi"), ikon dekoratif `aria-hidden`, focus ring dari design
 * system, dan touch target mobile ≥ 44px (px-4 py-3).
 */
export function PwaInstallButton({
  variant = "navbar",
  onInstall,
}: PwaInstallButtonProps) {
  if (variant === "menu") {
    return (
      <button
        type="button"
        onClick={onInstall}
        className="flex w-full items-center gap-3 rounded-lg border border-transparent px-4 py-3 text-left transition-all hover:bg-muted/60 hover:border-muted-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Download aria-hidden="true" className="size-4 shrink-0" />
        Install Aplikasi
      </button>
    );
  }

  return (
    // Tampil hanya pada layar xl (≥1280px): pada lebar 768–1279px area kanan
    // navbar (CTA + theme + tombol auth) akan tumpang tindih dengan menu utama,
    // dan Navbar tidak boleh didesain ulang. Di bawah xl, entri install tetap
    // tersedia lewat menu mobile (<768px) atau ikon install browser.
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onInstall}
      className="hidden xl:inline-flex"
    >
      <Download aria-hidden="true" />
      Install Aplikasi
    </Button>
  );
}
