// src/hooks/use-install-prompt.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook install prompt PWA (Phase 7).
 *
 * Menjembatani event browser `beforeinstallprompt` + `appinstalled`, deteksi
 * status terinstall, dan memori dismissal (localStorage) menjadi state React
 * yang aman untuk SSR/hydration.
 *
 * Alur singkat:
 *   beforeinstallprompt → deferred event → canInstall → CTA install
 *   promptInstall() → prompt() → userChoice accepted/dismissed
 *   dismissInstall() / userChoice "dismissed" → dismissal tersimpan
 *   appinstalled / display-mode standalone → isInstalled
 *
 * Semua akses browser API hanya terjadi setelah mount (effect) atau di dalam
 * event handler; tidak ada akses window/navigator/localStorage saat SSR.
 */

// ---------------------------------------------------------------------------
// Kontrak event browser (lokal, tanpa `any`, tanpa mengubah tipe DOM global)
// ---------------------------------------------------------------------------

// `BeforeInstallPromptEvent` tidak ada di lib DOM TypeScript standar, jadi
// hanya bagian yang dipakai yang dideklarasikan di sini.
interface InstallPromptChoice {
  readonly outcome: "accepted" | "dismissed";
  readonly platform: string;
}

interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<InstallPromptChoice>;
  prompt: () => Promise<void>;
}

/** Type guard eksplisit: hanya event yang benar-benar bisa diprompt yang dipakai. */
function isBeforeInstallPromptEvent(
  event: Event
): event is BeforeInstallPromptEvent {
  const candidate = event as Partial<BeforeInstallPromptEvent>;
  return (
    event.type === "beforeinstallprompt" &&
    typeof candidate.prompt === "function" &&
    typeof candidate.userChoice?.then === "function"
  );
}

/** `navigator.standalone` hanya ada di Safari/iOS — akses harus defensif. */
type NavigatorWithStandalone = Navigator & { readonly standalone?: boolean };

// ---------------------------------------------------------------------------
// Memori dismissal (localStorage namespaced; tidak pernah dikirim ke server)
// ---------------------------------------------------------------------------

export const INSTALL_DISMISSAL_STORAGE_KEY = "daurtica:pwa-install-dismissed";

/**
 * Nilai yang disimpan: `{"dismissedAt": <epoch ms>}`.
 *
 * Kebijakan saat ini: dismissal bersifat permanen — keberadaan key berarti CTA
 * tidak ditampilkan lagi. Timestamp disimpan agar cooldown di masa depan bisa
 * ditambahkan tanpa migrasi format. Lihat docs/pwa-install-prompt.md.
 */
interface InstallDismissalRecord {
  dismissedAt: number;
}

function readDismissal(): boolean {
  try {
    return window.localStorage.getItem(INSTALL_DISMISSAL_STORAGE_KEY) !== null;
  } catch {
    // localStorage bisa throw (mode privat / storage diblokir) → anggap belum dismissed.
    return false;
  }
}

function persistDismissal(): void {
  try {
    const record: InstallDismissalRecord = { dismissedAt: Date.now() };
    window.localStorage.setItem(
      INSTALL_DISMISSAL_STORAGE_KEY,
      JSON.stringify(record)
    );
  } catch {
    // Dismissal tetap berlaku untuk sesi berjalan walau storage tidak tersedia.
  }
}

function clearDismissal(): void {
  try {
    window.localStorage.removeItem(INSTALL_DISMISSAL_STORAGE_KEY);
  } catch {
    // Diamkan — tidak ada aksi yang aman dilakukan.
  }
}

/** Deteksi app berjalan sebagai PWA terinstall (Chromium + Safari/iOS). */
function isStandaloneDisplayMode(): boolean {
  try {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    return (window.navigator as NavigatorWithStandalone).standalone === true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export type InstallPromptResult = "accepted" | "dismissed" | "unavailable";

export interface UseInstallPromptResult {
  /** True hanya saat deferred prompt tersedia, belum terinstall, belum dismissed. */
  canInstall: boolean;
  isInstalled: boolean;
  /** Konsumsi deferred event & tampilkan prompt browser; resolve hasil userChoice. */
  promptInstall: () => Promise<InstallPromptResult>;
  /** Sembunyikan CTA & simpan dismissal tanpa memanggil prompt(). */
  dismissInstall: () => void;
}

export function useInstallPrompt(): UseInstallPromptResult {
  // Default SSR-safe: tidak ada prompt, belum terinstall, belum dismissed.
  // Nilai sebenarnya dibaca di effect setelah mount.
  const [hasDeferredPrompt, setHasDeferredPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  const dismissInstall = useCallback(() => {
    // Lepas event yang belum dikonsumsi agar tidak pernah diprompt setelah ini.
    deferredPromptRef.current = null;
    setHasDeferredPrompt(false);
    persistDismissal();
    setIsDismissed(true);
  }, []);

  const promptInstall = useCallback(async (): Promise<InstallPromptResult> => {
    const deferredPrompt = deferredPromptRef.current;
    if (!deferredPrompt) return "unavailable";

    // Event hanya bisa dikonsumsi sekali: lepas referensi & state sebelum
    // prompt() supaya CTA langsung tersembunyi dan prompt() tidak mungkin
    // dipanggil dua kali untuk event yang sama.
    deferredPromptRef.current = null;
    setHasDeferredPrompt(false);

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === "accepted") {
        // Defensif: sebagian browser tidak (atau lambat) memicu `appinstalled`.
        clearDismissal();
        setIsDismissed(false);
        setIsInstalled(true);
        return "accepted";
      }

      // User menutup prompt tanpa install → ingat dismissal (persisten).
      dismissInstall();
      return "dismissed";
    } catch {
      // prompt() bisa throw (mis. event sudah tidak valid). Event sudah dilepas;
      // jangan crash dan jangan tampilkan error apa pun ke user.
      return "unavailable";
    }
  }, [dismissInstall]);

  useEffect(() => {
    // Baca kondisi awal hanya di client (setelah mount) → aman untuk hydration.
    setIsInstalled(isStandaloneDisplayMode());
    setIsDismissed(readDismissal());

    const handleBeforeInstallPrompt = (event: Event) => {
      if (!isBeforeInstallPromptEvent(event)) return;
      // Tahan mini-infobar otomatis browser; CTA Daurtica yang menentukan
      // kapan prompt() dipanggil.
      event.preventDefault();
      deferredPromptRef.current = event;
      setHasDeferredPrompt(true);
    };

    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setHasDeferredPrompt(false);
      setIsInstalled(true);
      clearDismissal();
      setIsDismissed(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // display-mode bisa berubah tanpa reload; ikut perbarui status terinstall.
    let displayModeQuery: MediaQueryList | null = null;
    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsInstalled(true);
    };
    try {
      displayModeQuery = window.matchMedia("(display-mode: standalone)");
      displayModeQuery.addEventListener("change", handleDisplayModeChange);
    } catch {
      displayModeQuery = null;
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      displayModeQuery?.removeEventListener("change", handleDisplayModeChange);
    };
  }, []);

  return {
    canInstall: hasDeferredPrompt && !isInstalled && !isDismissed,
    isInstalled,
    promptInstall,
    dismissInstall,
  };
}
