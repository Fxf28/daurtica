// lib/api/classification.ts
import { z } from "zod";

// Response schema untuk validasi response - PERBAIKAN: confidence sebagai number
export const ClassificationResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    id: z.string(),
    userId: z.string(),
    imageUrl: z.string().nullable(),
    topLabel: z.string(),
    confidence: z.number(), // ✅ Diubah dari string ke number
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

// PERBAIKAN: Tambah error handling yang lebih robust
export async function saveClassification(data: SaveClassificationParams) {
  try {
    const response = await fetch("/api/classification/history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();

    // Validasi response
    const validatedResult = ClassificationResponseSchema.safeParse(result);
    if (!validatedResult.success) {
      console.error("Validation error:", validatedResult.error);
      throw new Error("Invalid response format from server");
    }

    return validatedResult.data;
  } catch (error) {
    console.error("Save classification error:", error);
    throw error;
  }
}
