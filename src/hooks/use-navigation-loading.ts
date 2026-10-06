// src/hooks/use-navigation-loading.ts
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Safety net: if a navigation never completes (cancelled/failed), reset the
// indicator automatically so it can never stay stuck permanently.
const LOADING_SAFETY_TIMEOUT_MS = 8000;

export function useNavigationLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset loading ketika route berubah
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsLoading(false);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      // Hanya left-click tanpa modifier. Ctrl/Cmd/Shift/Alt-click dan
      // middle-click membuka tab/jendela baru dan bukan navigasi SPA.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      // Cari anchor element terdekat dari elemen yang diklik
      const target = event.target as HTMLElement;
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      // Lewati link unduhan dan link yang membuka tab/jendela lain
      if (anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      // Hanya tangani navigasi internal (origin yang sama)
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      // Lewati jika sudah berada di halaman yang sama (path + query sama)
      const currentUrl = window.location;
      if (url.pathname === currentUrl.pathname && url.search === currentUrl.search) {
        return;
      }

      setIsLoading(true);

      // Safety net: pastikan indikator tidak macet jika navigasi tidak terjadi
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        setIsLoading(false);
      }, LOADING_SAFETY_TIMEOUT_MS);
    };

    // Use event delegation for better performance
    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return isLoading;
}
