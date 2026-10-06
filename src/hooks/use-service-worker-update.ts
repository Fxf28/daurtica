// src/hooks/use-service-worker-update.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook siklus hidup pembaruan Service Worker (Phase 8).
 *
 * Latar belakang (hasil audit Phase 8A):
 * - `next.config.ts` memakai `@ducanh2912/next-pwa` dengan `register: true`.
 *   Plugin menyuntikkan `new Workbox(origin + "/sw.js", { scope: "/" })` +
 *   `window.workbox.register()` ke bundle klien (terverifikasi di
 *   `.next/static/chunks/main-*.js`). Artinya service worker SUDAH diregistrasi
 *   oleh plugin — hook ini TIDAK PERNAH memanggil `register()`.
 * - Hook hanya menemukan registrasi yang ada lewat
 *   `navigator.serviceWorker.getRegistration()` lalu menempelkan listener
 *   `updatefound` / `controllerchange` / `statechange` pada registrasi itu.
 * - `public/sw.js` yang dihasilkan memakai `self.skipWaiting()` +
 *   `clientsClaim()`. Worker baru karena itu langsung aktif dan mengambil alih
 *   halaman tanpa fase "waiting" yang menetap, sehingga TIDAK ada alur
 *   `waiting.postMessage({ type: "SKIP_WAITING" })` yang dibuat di sini.
 *
 * Model state:
 *   unsupported → checking → up-to-date ↔ update-available → updating
 *
 * Semua akses `window` / `navigator` / `document` / `sessionStorage` hanya
 * terjadi di dalam effect (setelah mount) atau event handler; tidak ada akses
 * browser API saat SSR, sehingga HTML server stabil dan tidak ada hydration
 * mismatch.
 */

// ---------------------------------------------------------------------------
// Kontrak publik
// ---------------------------------------------------------------------------

export type ServiceWorkerUpdateState =
  | "unsupported"
  | "checking"
  | "up-to-date"
  | "update-available"
  | "updating";

export interface UseServiceWorkerUpdateResult {
  state: ServiceWorkerUpdateState;
  /** True saat versi baru siap dan halaman belum dimuat ulang. */
  updateAvailable: boolean;
  /** True setelah user memilih "Nanti" untuk pembaruan yang sedang terdeteksi. */
  dismissed: boolean;
  /** Jalankan alur pembaruan terkendali (reload sekali, dengan guard). */
  update: () => void;
  /** Sembunyikan banner untuk sementara; tidak membatalkan update. */
  dismiss: () => void;
}

/**
 * Penanda satu kali di sessionStorage yang ditulis tepat sebelum reload
 * pembaruan dijalankan. Dibaca & dibuang saat mount berikutnya — titik reset
 * guard — sehingga pembaruan berikutnya yang benar-benar independen tetap
 * bisa reload normal. Kunci & alasan didokumentasikan di
 * docs/pwa-update-lifecycle.md.
 */
export const SW_UPDATE_RELOAD_KEY = "daurtica:pwa-update-reloaded";

/** Jeda minimum antar pemeriksaan `registration.update()` di background. */
const UPDATE_CHECK_THROTTLE_MS = 5 * 60 * 1000;

/**
 * Batas tunggu `controllerchange` setelah user menekan "Perbarui sekarang".
 * Jika tidak terjadi, state kembali ke `update-available` — TIDAK reload buta,
 * karena reload tanpa pergantian controller berisiko loop tanpa hasil.
 */
const CONTROLLER_RELOAD_TIMEOUT_MS = 5000;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useServiceWorkerUpdate(): UseServiceWorkerUpdateResult {
  // Nilai awal SSR-safe & sama di server/klien pertama: "checking" tidak
  // menampilkan UI apa pun. Nilai sebenarnya ditentukan di effect.
  const [state, setState] = useState<ServiceWorkerUpdateState>("checking");
  const [dismissed, setDismissed] = useState(false);

  const stateRef = useRef<ServiceWorkerUpdateState>("checking");
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const lastControllerRef = useRef<ServiceWorker | null>(null);
  const newControllerSeenRef = useRef(false);
  const pendingControllerReloadRef = useRef(false);
  const reloadScheduledRef = useRef(false);
  const reloadGuardedRef = useRef(false);
  const reloadTimerRef = useRef<number | null>(null);
  const lastCheckAtRef = useRef(0);

  // stateRef menjaga event handler tetap membaca state terbaru tanpa ikut
  // menjadi dependensi effect.
  const setUpdateState = useCallback((next: ServiceWorkerUpdateState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  /**
   * Tandai versi baru tersedia. Hanya transisi MASUK ke `update-available`
   * yang mereset dismissal; sinyal kedua untuk update yang sama (mis.
   * `installed` lalu `controllerchange`) tidak boleh memunculkan kembali
   * banner yang sudah di-"Nanti"-kan.
   */
  const markUpdateAvailable = useCallback(() => {
    if (
      stateRef.current === "update-available" ||
      stateRef.current === "updating"
    ) {
      return;
    }
    setDismissed(false);
    setUpdateState("update-available");
  }, [setUpdateState]);

  /**
   * Reload terkendali. Idempoten per halaman:
   * - `reloadGuardedRef` mencegah dua reload dari satu halaman yang sama.
   * - penanda sessionStorage memastikan jejak reload satu kali dapat dibaca
   *   dan dibuang pada mount berikutnya.
   */
  const reloadGuarded = useCallback(() => {
    if (reloadGuardedRef.current) return;
    reloadGuardedRef.current = true;
    try {
      window.sessionStorage.setItem(SW_UPDATE_RELOAD_KEY, String(Date.now()));
    } catch {
      // Storage tidak tersedia (mode privat / diblokir) — guard in-memory
      // tetap berlaku untuk halaman ini.
    }
    window.location.reload();
  }, []);

  /**
   * Pemeriksaan update yang aman: error (offline, respons invalid, dsb.)
   * tidak pernah dilempar ke UI.
   */
  const safeRegistrationUpdate = useCallback(async () => {
    const registration = registrationRef.current;
    if (!registration) return;
    try {
      await registration.update();
    } catch {
      // Gagal memeriksa bukan kegagalan aplikasi — diamkan.
    }
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      setUpdateState("unsupported");
      return;
    }

    const container = navigator.serviceWorker;
    let cancelled = false;
    const cleanups: Array<() => void> = [];
    const workerCleanups = new Set<() => void>();

    // Titik reset guard: penanda reload dari update sebelumnya dibuang di sini
    // supaya update independen berikutnya tetap dapat reload normal.
    try {
      window.sessionStorage.removeItem(SW_UPDATE_RELOAD_KEY);
    } catch {
      // Storage tidak tersedia — tidak ada yang perlu dibersihkan.
    }

    // Controller awal. `null` berarti halaman belum dikontrol SW (kunjungan
    // pertama / instalasi pertama), sehingga `controllerchange` pertama BUKAN
    // update dan tidak boleh memicu banner atau reload.
    lastControllerRef.current = container.controller;

    const handleControllerChange = () => {
      const nextController = container.controller;
      const hadController = lastControllerRef.current !== null;
      lastControllerRef.current = nextController;

      if (!hadController) return; // klaim pertama, bukan update.

      newControllerSeenRef.current = true;

      if (pendingControllerReloadRef.current) {
        pendingControllerReloadRef.current = false;
        if (reloadTimerRef.current !== null) {
          window.clearTimeout(reloadTimerRef.current);
          reloadTimerRef.current = null;
        }
        reloadGuarded();
        return;
      }

      markUpdateAvailable();
    };

    const trackInstallingWorker = (
      registration: ServiceWorkerRegistration,
      worker: ServiceWorker
    ) => {
      // Tanpa worker aktif sebelumnya, ini instalasi pertama (bukan update).
      if (registration.active === null) return;

      const handleStateChange = () => {
        // `installed` = precache worker baru selesai. Karena `skipWaiting`,
        // `activating`/`activated` menyusul hampir seketika; ketiganya berarti
        // versi baru siap mengambil alih.
        if (
          worker.state === "installed" ||
          worker.state === "activating" ||
          worker.state === "activated"
        ) {
          markUpdateAvailable();
        }
      };

      worker.addEventListener("statechange", handleStateChange);
      workerCleanups.add(() =>
        worker.removeEventListener("statechange", handleStateChange)
      );
      // Worker bisa sudah bergerak sebelum listener terpasang.
      handleStateChange();
    };

    const handleUpdateFound = () => {
      const registration = registrationRef.current;
      if (!registration) return;

      const installingWorker = registration.installing;
      if (installingWorker) {
        trackInstallingWorker(registration, installingWorker);
        return;
      }

      // Kasus klasik (worker menunggu). Dengan `skipWaiting` ini transien,
      // tetapi tetap dikenali agar banner tidak pernah kehilangan update.
      if (registration.waiting && registration.active) {
        markUpdateAvailable();
      }
    };

    const maybeBackgroundCheck = () => {
      if (cancelled) return;
      if (stateRef.current === "unsupported") return;
      const now = Date.now();
      if (now - lastCheckAtRef.current < UPDATE_CHECK_THROTTLE_MS) return;
      lastCheckAtRef.current = now;
      void safeRegistrationUpdate();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") maybeBackgroundCheck();
    };

    container.addEventListener("controllerchange", handleControllerChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", maybeBackgroundCheck);
    cleanups.push(() =>
      container.removeEventListener("controllerchange", handleControllerChange)
    );
    cleanups.push(() =>
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    );
    cleanups.push(() => window.removeEventListener("focus", maybeBackgroundCheck));

    void (async () => {
      let registration: ServiceWorkerRegistration | undefined;
      try {
        // Integrasi dengan registrasi milik plugin — TIDAK memanggil
        // register() agar tidak ada registrasi kedua / scope kedua.
        registration = (await container.getRegistration()) ?? undefined;
      } catch {
        registration = undefined;
      }
      if (cancelled) return;

      const attachRegistration = (found: ServiceWorkerRegistration) => {
        if (registrationRef.current) return;
        registrationRef.current = found;
        found.addEventListener("updatefound", handleUpdateFound);
        cleanups.push(() =>
          found.removeEventListener("updatefound", handleUpdateFound)
        );

        // Update bisa sudah ditemukan browser sebelum hook sempat mount
        // (mis. pemeriksaan otomatis saat navigasi).
        if (found.installing) {
          trackInstallingWorker(found, found.installing);
        } else if (found.waiting && found.active) {
          markUpdateAvailable();
        }

        if (stateRef.current !== "update-available") {
          setUpdateState("up-to-date");
        }

        // Satu pemeriksaan terarah setelah discovery (bukan polling).
        lastCheckAtRef.current = Date.now();
        void safeRegistrationUpdate();
      };

      if (registration) {
        attachRegistration(registration);
        return;
      }

      // Kunjungan pertama: registrasi plugin bisa belum terbentuk saat hook
      // mount. Tidak ada polling — cukup tunggu `ready` (resolve saat worker
      // aktif pertama ada), lalu tempelkan listener. Bila registrasi memang
      // tidak pernah ada, promise ini tetap pending tanpa efek samping.
      setUpdateState("up-to-date");
      void container.ready
        .then(() => container.getRegistration())
        .then((lateRegistration) => {
          if (!cancelled && lateRegistration) {
            attachRegistration(lateRegistration);
          }
        })
        .catch(() => {
          // Tidak ada aksi aman yang perlu dilakukan.
        });
    })();

    return () => {
      cancelled = true;
      cleanups.forEach((cleanup) => cleanup());
      workerCleanups.forEach((cleanup) => cleanup());
      workerCleanups.clear();
      if (reloadTimerRef.current !== null) {
        window.clearTimeout(reloadTimerRef.current);
        reloadTimerRef.current = null;
      }
      pendingControllerReloadRef.current = false;
      // Ref bertahan lintas remount (StrictMode dev); bersihkan agar effect
      // dapat menempel ulang ke registrasi yang sama pada mount berikutnya.
      registrationRef.current = null;
    };
  }, [markUpdateAvailable, reloadGuarded, safeRegistrationUpdate, setUpdateState]);

  /**
   * Alur update terkendali (Phase 8H):
   *
   *   update-available → user klik → updating
   *     ├─ controller sudah berganti (skipWaiting + clientsClaim) → reload
   *     ├─ worker menunggu (defensif, seharusnya transien)      → reload
   *     └─ controllerchange belum teramati → tunggu event
   *            └─ timeout 5 dtk tanpa event → kembali ke banner (tanpa reload)
   *
   * Reload HANYA terjadi dari aksi user atau controllerchange yang ditunggu
   * setelah aksi user — tidak pernah otomatis dari controllerchange biasa.
   */
  const update = useCallback(() => {
    if (stateRef.current !== "update-available") return;
    if (reloadScheduledRef.current) return;

    reloadScheduledRef.current = true;
    setUpdateState("updating");

    const registration = registrationRef.current;
    const waitingWorker = registration?.waiting ?? null;

    if (newControllerSeenRef.current || waitingWorker) {
      reloadGuarded();
      return;
    }

    pendingControllerReloadRef.current = true;
    reloadTimerRef.current = window.setTimeout(() => {
      pendingControllerReloadRef.current = false;
      reloadScheduledRef.current = false;
      reloadTimerRef.current = null;
      if (stateRef.current === "updating") setUpdateState("update-available");
    }, CONTROLLER_RELOAD_TIMEOUT_MS);
  }, [reloadGuarded, setUpdateState]);

  /**
   * "Nanti": sembunyikan banner. Tidak membatalkan instalasi SW, tidak
   * unregister, tidak menghapus cache, dan tidak menyimpan dismissal secara
   * permanen — state ini hanya berlaku untuk halaman berjalan.
   */
  const dismiss = useCallback(() => {
    if (stateRef.current === "update-available") {
      setDismissed(true);
    }
  }, []);

  return {
    state,
    updateAvailable: state === "update-available",
    dismissed,
    update,
    dismiss,
  };
}
