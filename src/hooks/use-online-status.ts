"use client";

import { useState, useEffect } from "react";

export function useOnlineStatus() {
  // Default true agar tidak flicker saat SSR
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Cek status saat mount (client-side only)
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
