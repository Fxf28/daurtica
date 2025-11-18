// lib/api/classification-history.ts
import { z } from "zod";

// Response schemas - PERBAIKAN: confidence sebagai number
export const ClassificationHistorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  imageUrl: z.string().nullable(),
  topLabel: z.string(),
  confidence: z.number(), // ✅ Tetap sebagai number
  allResults: z.array(
    z.object({
      label: z.string(),
      confidence: z.number(), // ✅ Tetap sebagai number
    })
  ),
  source: z.string(),
  processingTime: z.number().nullable(),
  imageSize: z.number().nullable(),
  deviceType: z.string().nullable(),
  createdAt: z.string(),
});

export const PaginatedResponseSchema = z.object({
  data: z.array(ClassificationHistorySchema),
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

// PERBAIKAN: Tambah proper error handling di semua functions
export async function getClassificationById(id: string) {
  try {
    const response = await fetch(`/api/classification/history/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const validatedResult = ClassificationHistorySchema.safeParse(result.data);

    if (!validatedResult.success) {
      console.error("Validation error:", validatedResult.error);
      throw new Error("Invalid response data from server");
    }

    return validatedResult.data;
  } catch (error) {
    console.error(`Error getting classification ${id}:`, error);
    throw error;
  }
}

// DELETE classification by ID dengan error handling
export async function deleteClassificationById(id: string) {
  try {
    const response = await fetch(`/api/classification/history/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const validatedResult = ClassificationHistorySchema.safeParse(result.data);

    if (!validatedResult.success) {
      console.error("Validation error:", validatedResult.error);
      throw new Error("Invalid response data from server");
    }

    return validatedResult.data;
  } catch (error) {
    console.error(`Error deleting classification ${id}:`, error);
    throw error;
  }
}

// GET paginated classifications dengan error handling
export async function getClassificationHistory(page: number = 1, limit: number = 12) {
  try {
    const response = await fetch(`/api/classification/history?page=${page}&limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const validatedResult = PaginatedResponseSchema.safeParse(result);

    if (!validatedResult.success) {
      console.error("Validation error:", validatedResult.error);
      throw new Error("Invalid response data from server");
    }

    return validatedResult.data;
  } catch (error) {
    console.error("Error getting classification history:", error);
    throw error;
  }
}
