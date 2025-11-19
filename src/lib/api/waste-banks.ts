import type { WasteBank, CreateWasteBank, UpdateWasteBank, WasteBankFilters, WasteBankListResponse } from "@/types/waste-bank";

const requestCache = new Map();

function generateCacheKey(url: string, options?: RequestInit): string {
  return `${url}-${JSON.stringify(options?.body || {})}`;
}

export async function getWasteBanks(filters: WasteBankFilters = {}): Promise<WasteBankListResponse> {
  const { search } = filters;
  const page = 1;
  const limit = 50;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
  });

  const url = `/api/waste-banks?${queryParams}`;
  const cacheKey = generateCacheKey(url);

  // Return cached result if available
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey);
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  // Cache the result for 5 seconds
  requestCache.set(cacheKey, result);
  setTimeout(() => requestCache.delete(cacheKey), 5000);

  return result;
}

export async function getWasteBankById(id: string): Promise<WasteBank> {
  const response = await fetch(`/api/waste-banks/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

export async function createWasteBank(data: CreateWasteBank): Promise<WasteBank> {
  const response = await fetch("/api/waste-banks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

export async function updateWasteBank(id: string, data: UpdateWasteBank): Promise<WasteBank> {
  const response = await fetch(`/api/waste-banks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}

export async function deleteWasteBank(id: string): Promise<void> {
  const response = await fetch(`/api/waste-banks/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
}

export async function getNearbyWasteBanks(lat: number, lng: number, radius: number = 10): Promise<WasteBank[]> {
  const response = await fetch(`/api/waste-banks/near?lat=${lat}&lng=${lng}&radius=${radius}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  return result.data;
}
