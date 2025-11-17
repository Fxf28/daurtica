// lib/api/classification.ts
import { z } from "zod";

// Response schema untuk validasi response
export const ClassificationResponseSchema = z.object({
  message: z.string(),
  data: z.object({
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
  }),
});

export type SaveClassificationParams = {
  imageUrl?: string;
  topLabel: string;
  confidence: number;
  allResults: Array<{ label: string; confidence: number }>;
  source: "camera" | "upload";
  processingTime?: number;
  imageSize?: number;
  deviceType?: string;
};

export async function saveClassification(data: SaveClassificationParams) {
  const response = await fetch("/api/classification/history", {
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

  // Validasi response
  const validatedResult = ClassificationResponseSchema.safeParse(result);
  if (!validatedResult.success) {
    throw new Error("Invalid response from server");
  }

  return validatedResult.data;
}
