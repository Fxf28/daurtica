// src/hooks/use-navigation-loading.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export function useNavigationLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [navigationStartTime, setNavigationStartTime] = useState<number | null>(null);
  const pathname = usePathname();

  // Reset loading ketika route berubah - hanya gunakan pathname
  useEffect(() => {
    setIsLoading(false);
    setNavigationStartTime(null);
  }, [pathname]); // Hapus searchParams dari dependencies

  // Fallback timeout untuk memastikan loading selalu berhenti
  useEffect(() => {
    if (!isLoading || !navigationStartTime) return;

    const timeout = setTimeout(() => {
      console.warn("Navigation loading timeout - forcing stop");
      setIsLoading(false);
      setNavigationStartTime(null);
    }, 30000); // 30 second timeout

    return () => clearTimeout(timeout);
  }, [isLoading, navigationStartTime]);

  const handleAnchorClick = useCallback((event: Event) => {
    const target = event.currentTarget as HTMLAnchorElement;
    const href = target.getAttribute("href");

    // Only handle internal navigation
    if (href && href.startsWith("/") && !href.startsWith("#") && target.target !== "_blank") {
      // Prevent handling if already on the same page
      const currentUrl = window.location.pathname + window.location.search;
      if (href !== currentUrl) {
        setIsLoading(true);
        setNavigationStartTime(Date.now());
      }
    }
  }, []);

  const handleBeforeUnload = useCallback(() => {
    setIsLoading(true);
  }, []);

  useEffect(() => {
    // Store references to all anchor elements we've added listeners to
    const anchoredElements: HTMLAnchorElement[] = [];

    const handleMutation: MutationCallback = () => {
      const anchorElements = document.querySelectorAll('a[href^="/"]');

      // Remove existing listeners first
      anchoredElements.forEach((anchor) => {
        anchor.removeEventListener("click", handleAnchorClick);
      });
      anchoredElements.length = 0; // Clear the array

      // Add new listeners
      anchorElements.forEach((anchor) => {
        const anchorElem = anchor as HTMLAnchorElement;
        // Skip if target="_blank" or it's a hash link
        if (anchorElem.target !== "_blank" && !anchorElem.getAttribute("href")?.startsWith("#")) {
          anchorElem.addEventListener("click", handleAnchorClick);
          anchoredElements.push(anchorElem);
        }
      });
    };

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);

    const observer = new MutationObserver(handleMutation);
    observer.observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["href"],
    });

    // Initial setup
    handleMutation([], observer);

    return () => {
      // Cleanup
      observer.disconnect();
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Remove all click listeners
      anchoredElements.forEach((anchor) => {
        anchor.removeEventListener("click", handleAnchorClick);
      });
    };
  }, [handleAnchorClick, handleBeforeUnload]);

  return isLoading;
}
