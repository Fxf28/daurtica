// src/types/waste-bank.ts
export interface WasteBank {
  id: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  openingHours?: string | null;
  description?: string | null;
  typesAccepted: string[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateWasteBank {
  name: string;
  address: string;
  latitude: number | string;
  longitude: number | string;
  phone?: string;
  email?: string;
  website?: string;
  openingHours?: string;
  description?: string;
  typesAccepted?: string[];
}

export interface UpdateWasteBank {
  name?: string;
  address?: string;
  latitude?: number | string;
  longitude?: number | string;
  phone?: string;
  email?: string;
  website?: string;
  openingHours?: string;
  description?: string;
  typesAccepted?: string[];
  isActive?: boolean;
}

export interface WasteBankFilters {
  search?: string;
  isActive?: boolean;
}

export interface WasteBankListResponse {
  data: WasteBank[];
  pagination: {
    page: number;
    limit: number;
    offset: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
