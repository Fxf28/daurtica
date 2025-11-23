// src/hooks/use-global-loading.ts
"use client";

import { useMemo } from "react";
import { useNavigationLoading } from "./use-navigation-loading";
import { useIsFetching } from "@tanstack/react-query";
import { useSWRConfig } from "swr"; // Pastikan SWR di-install

export function useGlobalLoading() {
  // navigation-based loading (custom hook)
  const isNavigating = useNavigationLoading();

  // react-query: number of active fetches (0 means idle)
  const reactQueryFetching = useIsFetching();
  const isReactQueryFetching = reactQueryFetching > 0;

  // SWR: gunakan useSWRConfig dengan benar
  const { cache } = useSWRConfig();
  const isSwrFetching = useMemo(() => {
    // Cek jika ada request SWR yang sedang loading
    if (cache && typeof cache === "object" && "keys" in cache) {
      const keys = Array.from(cache.keys() as Iterable<string>);
      return keys.some((key) => {
        const value = cache.get(key);
        return value && typeof value === "object" && "isLoading" in value && value.isLoading;
      });
    }
    return false;
  }, [cache]);

  // combine states dengan prioritas: navigation loading pertama
  return useMemo(() => {
    // Jika sedang navigasi, selalu return true
    if (isNavigating) return true;

    // Untuk fetching, kita bisa lebih toleran
    return isReactQueryFetching || isSwrFetching;
  }, [isNavigating, isReactQueryFetching, isSwrFetching]);
}
