// lib/api/classification.ts
import { z } from "zod";

// Response schema untuk validasi response
export const ClassificationResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    id: z.string(),
    userId: z.string(),
    imageUrl: z.string().nullable(),
    cloudinaryPublicId: z.string().nullable(), // ✅ TAMBAH INI
    topLabel: z.string(),
    confidence: z.number(),
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
  imageFile?: File | Blob; // ✅ TERIMA BOTH FILE DAN BLOB
  topLabel: string;
  confidence: number;
  allResults: Array<{ label: string; confidence: number }>;
  source: "camera" | "upload";
  processingTime?: number;
  imageSize?: number;
  deviceType?: string;
};

export async function saveClassification(data: SaveClassificationParams) {
  try {
    const formData = new FormData();

    if (data.imageFile) {
      // ✅ KONVERSI BLOB KE FILE JIKA PERLU
      let fileToUpload: File;

      if (data.imageFile instanceof Blob && !(data.imageFile instanceof File)) {
        // Jika dari camera (Blob), konversi ke File
        fileToUpload = new File([data.imageFile], `classification-${Date.now()}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
      } else {
        // Jika dari upload (sudah File), gunakan langsung
        fileToUpload = data.imageFile as File;
      }

      formData.append("image", fileToUpload);
    }

    formData.append("topLabel", data.topLabel);
    formData.append("confidence", data.confidence.toString());
    formData.append("allResults", JSON.stringify(data.allResults));
    formData.append("source", data.source);

    if (data.processingTime) {
      formData.append("processingTime", data.processingTime.toString());
    }

    if (data.imageSize) {
      formData.append("imageSize", data.imageSize.toString());
    }

    if (data.deviceType) {
      formData.append("deviceType", data.deviceType);
    }

    const response = await fetch("/api/classification/history", {
      method: "POST",
      body: formData,
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
