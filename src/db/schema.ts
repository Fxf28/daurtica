// db/schema.ts
import { pgTable, text, uuid, jsonb, timestamp, numeric, integer } from "drizzle-orm/pg-core";

export const classificationHistory = pgTable("classification_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  imageUrl: text("image_url"),
  topLabel: text("top_label").notNull(),
  confidence: numeric("confidence").notNull(),
  allResults: jsonb("all_results").notNull(),
  source: text("source").notNull(), // "camera" / "upload"
  processingTime: integer("processing_time"), // waktu proses dalam ms
  imageSize: integer("image_size"), // ukuran gambar dalam bytes
  deviceType: text("device_type"), // "mobile", "desktop", dll
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Index untuk performa query
export const classificationHistoryUserIdIndex = classificationHistory.userId;
export const classificationHistoryCreatedAtIndex = classificationHistory.createdAt;
export const classificationHistoryLabelIndex = classificationHistory.topLabel;
