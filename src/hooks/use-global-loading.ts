// src/hooks/use-global-loading.ts
"use client";

import { useMemo } from "react";
import { useNavigationLoading } from "./use-navigation-loading";
import { useIsFetching } from "@tanstack/react-query";

export function useGlobalLoading() {
  // navigation-based loading (custom hook)
  const isNavigating = useNavigationLoading();

  // react-query: number of active fetches (0 means idle)
  const reactQueryFetching = useIsFetching();
  const isReactQueryFetching = reactQueryFetching > 0;

  // Hapus SWR untuk sementara karena kompleks dan berat
  // combine states dengan prioritas: navigation loading pertama
  return useMemo(() => {
    // Jika sedang navigasi, selalu return true
    if (isNavigating) return true;

    // Untuk fetching, kita bisa lebih toleran
    return isReactQueryFetching;
  }, [isNavigating, isReactQueryFetching]);
}
