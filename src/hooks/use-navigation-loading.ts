// src/hooks/use-navigation-loading.ts
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function useNavigationLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  // Reset loading ketika route berubah
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      // Cari anchor element terdekat dari elemen yang diklik
      const target = event.target as HTMLElement;
      const anchor = target.closest("a[href]");

      if (anchor) {
        const href = anchor.getAttribute("href");

        // Only handle internal navigation
        if (href && href.startsWith("/") && !href.startsWith("#") && (anchor as HTMLAnchorElement).target !== "_blank") {
          // Prevent handling if already on the same page
          const currentUrl = window.location.pathname;
          if (href !== currentUrl) {
            setIsLoading(true);
          }
        }
      }
    };

    // Use event delegation for better performance
    document.addEventListener("click", handleClick);

    // Handle beforeunload for page refresh/close
    const handleBeforeUnload = () => setIsLoading(true);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return isLoading;
}
