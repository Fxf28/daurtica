// src/types/database.ts
import { classificationHistory } from "@/db/schema";

// Type dari Drizzle ORM untuk database results
export type ClassificationHistoryDB = typeof classificationHistory.$inferSelect;
export type ClassificationResultDB = {
  label: string;
  confidence: number | string;
};

// Type untuk data yang sudah ditransform
export interface TransformedClassificationHistory {
  id: string;
  userId: string;
  imageUrl: string | null;
  topLabel: string;
  confidence: number;
  allResults: Array<{
    label: string;
    confidence: number;
  }>;
  source: string;
  processingTime: number | null;
  imageSize: number | null;
  deviceType: string | null;
  createdAt: Date;
}
