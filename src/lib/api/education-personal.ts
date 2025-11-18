// src/lib/api/education-personal.ts
import { z } from "zod";
import type { EducationPersonal, GenerateEducationPersonal, EducationPersonalFilters } from "@/types/education";

// Gunakan Zod schema yang sesuai dengan types yang sudah ada
export const EducationPersonalSectionSchema = z.object({
  title: z.string(),
  content: z.string(),
});

export const EducationPersonalContentSchema = z.object({
  title: z.string(),
  content: z.string(),
  sections: z.array(EducationPersonalSectionSchema),
});

export const EducationPersonalResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  prompt: z.string(),
  generatedContent: EducationPersonalContentSchema,
  title: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
});

export const EducationPersonalListResponseSchema = z.object({
  data: z.array(EducationPersonalResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    offset: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
});

// ✅ PERBAIKAN: Hapus unused import dan tambahkan proper pagination type
interface PaginationInfo {
  page: number;
  limit: number;
  offset: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// API functions - return types menggunakan interface yang sudah ada
export async function getEducationPersonalList(filters: EducationPersonalFilters = {}): Promise<{ data: EducationPersonal[]; pagination: PaginationInfo }> {
  const { page = 1, limit = 12, ...restFilters } = filters;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...Object.entries(restFilters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        acc[key] = value.toString();
      }
      return acc;
    }, {} as Record<string, string>),
  });

  const response = await fetch(`/api/education/personal?${queryParams}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  const validatedResult = EducationPersonalListResponseSchema.safeParse(result);

  if (!validatedResult.success) {
    throw new Error("Invalid response from server");
  }

  return validatedResult.data;
}

export async function getEducationPersonalById(id: string): Promise<EducationPersonal> {
  const response = await fetch(`/api/education/personal/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  const validatedResult = EducationPersonalResponseSchema.safeParse(result.data);

  if (!validatedResult.success) {
    throw new Error("Invalid response from server");
  }

  return validatedResult.data;
}

export async function generateEducationPersonal(data: GenerateEducationPersonal): Promise<EducationPersonal> {
  const response = await fetch("/api/education/personal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  const validatedResult = EducationPersonalResponseSchema.safeParse(result.data);

  if (!validatedResult.success) {
    throw new Error("Invalid response from server");
  }

  return validatedResult.data;
}

export async function regenerateEducationPersonal(id: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`/api/education/personal/${id}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return { success: true, message: "Regeneration started" };
}

export async function deleteEducationPersonal(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/education/personal/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return { success: true };
}
