import { useState, useEffect, useCallback, useRef } from "react";
import type { WasteBank, WasteBankFilters } from "@/types/waste-bank";
import { getWasteBanks, getNearbyWasteBanks } from "@/lib/api/waste-banks";

// Custom error type untuk AbortError
class AbortError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "AbortError";
  }
}

// Helper function untuk check AbortError
function isAbortError(error: unknown): error is AbortError {
  return error instanceof Error && error.name === "AbortError";
}

export function useWasteBanks(filters: WasteBankFilters = {}) {
  const [wasteBanks, setWasteBanks] = useState<WasteBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadWasteBanks = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const response = await getWasteBanks(filters);

      // Only update state if component is still mounted
      if (!abortControllerRef.current.signal.aborted) {
        setWasteBanks(response.data);
      }
    } catch (err: unknown) {
      // Ignore abort errors
      if (isAbortError(err)) return;

      if (!abortControllerRef.current?.signal.aborted) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load waste banks";
        setError(errorMessage);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [filters]); // Hanya depend pada searchString

  useEffect(() => {
    loadWasteBanks();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadWasteBanks]);

  const refetch = useCallback(() => {
    loadWasteBanks();
  }, [loadWasteBanks]);

  return { wasteBanks, loading, error, refetch };
}

export function useNearbyWasteBanks(lat: number | null, lng: number | null, radius: number = 10) {
  const [nearbyBanks, setNearbyBanks] = useState<WasteBank[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadNearbyBanks = useCallback(async () => {
    if (!lat || !lng) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const banks = await getNearbyWasteBanks(lat, lng, radius);

      if (!abortControllerRef.current.signal.aborted) {
        setNearbyBanks(banks);
      }
    } catch (err: unknown) {
      if (isAbortError(err)) return;

      if (!abortControllerRef.current?.signal.aborted) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load nearby waste banks";
        setError(errorMessage);
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [lat, lng, radius]);

  useEffect(() => {
    if (lat && lng) {
      loadNearbyBanks();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadNearbyBanks, lat, lng]); // Tambahkan lat dan lng sebagai dependencies

  const refetch = useCallback(() => {
    loadNearbyBanks();
  }, [loadNearbyBanks]);

  return { nearbyBanks, loading, error, refetch };
}
