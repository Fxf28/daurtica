// lib/api/classification-history.ts
import { z } from "zod";

// Response schemas
export const ClassificationHistorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  imageUrl: z.string().nullable(),
  topLabel: z.string(),
  confidence: z.string(),
  allResults: z.array(
    z.object({
      label: z.string(),
      confidence: z.number(),
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

// GET single classification by ID
export async function getClassificationById(id: string) {
  const response = await fetch(`/api/classification/history/${id}`, {
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
  const validatedResult = ClassificationHistorySchema.safeParse(result.data);

  if (!validatedResult.success) {
    throw new Error("Invalid response data from server");
  }

  return validatedResult.data;
}

// DELETE classification by ID
export async function deleteClassificationById(id: string) {
  const response = await fetch(`/api/classification/history/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  const validatedResult = ClassificationHistorySchema.safeParse(result.data);

  if (!validatedResult.success) {
    throw new Error("Invalid response data from server");
  }

  return validatedResult.data;
}

// GET paginated classifications
export async function getClassificationHistory(page: number = 1, limit: number = 12) {
  const response = await fetch(`/api/classification/history?page=${page}&limit=${limit}`, {
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
  const validatedResult = PaginatedResponseSchema.safeParse(result);

  if (!validatedResult.success) {
    throw new Error("Invalid response data from server");
  }

  return validatedResult.data;
}
