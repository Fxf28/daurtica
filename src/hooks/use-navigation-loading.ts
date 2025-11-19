"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function useNavigationLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    // Store references to all anchor elements we've added listeners to
    const anchoredElements: HTMLAnchorElement[] = [];

    const handleAnchorClick = (event: Event) => {
      const target = event.currentTarget as HTMLAnchorElement;
      const href = target.getAttribute("href");

      // Only handle internal navigation
      if (href && href.startsWith("/") && target.target !== "_blank") {
        setIsLoading(true);
      }
    };

    const handleMutation: MutationCallback = () => {
      const anchorElements = document.querySelectorAll("a[href]");

      // Remove existing listeners first
      anchoredElements.forEach((anchor) => {
        anchor.removeEventListener("click", handleAnchorClick);
      });
      anchoredElements.length = 0; // Clear the array

      // Add new listeners
      anchorElements.forEach((anchor) => {
        const anchorElem = anchor as HTMLAnchorElement;
        anchorElem.addEventListener("click", handleAnchorClick);
        anchoredElements.push(anchorElem);
      });
    };

    // Handle page unload
    const handleBeforeUnload = () => setIsLoading(true);

    // Add event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);

    const observer = new MutationObserver(handleMutation);
    observer.observe(document, { childList: true, subtree: true });

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
  }, []);

  return isLoading;
}
