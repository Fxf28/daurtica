import { pgTable, text, uuid, jsonb, timestamp, numeric, integer, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Classification History Schema
export const classificationHistory = pgTable("classification_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  imageUrl: text("image_url"),
  topLabel: text("top_label").notNull(),
  confidence: numeric("confidence", { precision: 5, scale: 4 }).notNull(),
  allResults: jsonb("all_results").notNull(),
  source: text("source").notNull(), // "camera" / "upload"
  processingTime: integer("processing_time"),
  imageSize: integer("image_size"),
  deviceType: text("device_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Education Public Schema
export const educationPublic = pgTable("education_public", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).unique().notNull(),
  content: text("content").notNull(),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  authorId: varchar("author_id", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  tags: jsonb("tags").default("[]"),
  isPublished: boolean("is_published").default(false),
  excerpt: text("excerpt"),
  readingTime: integer("reading_time"),
});

// Education Personal Schema
export const educationPersonal = pgTable("education_personal", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  prompt: text("prompt").notNull(),
  generatedContent: jsonb("generated_content").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  tags: jsonb("tags").default("[]"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod Schemas - Classification History
export const insertClassificationHistorySchema = createInsertSchema(classificationHistory, {
  userId: z.string().min(1),
  imageUrl: z.string().url().optional().or(z.literal("")),
  topLabel: z.string().min(1),
  confidence: z.string().transform((val) => parseFloat(val)),
  allResults: z.array(
    z.object({
      label: z.string(),
      confidence: z.number(),
    })
  ),
  source: z.enum(["camera", "upload"]),
  processingTime: z.number().int().positive().optional(),
  imageSize: z.number().int().positive().optional(),
  deviceType: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
});

// Zod Schemas - Education Public
export const insertEducationPublicSchema = createInsertSchema(educationPublic, {
  title: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens"),
  content: z.string().min(1),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  excerpt: z.string().max(500).optional(),
  readingTime: z.number().int().positive().optional(),
}).omit({
  id: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
});

export const updateEducationPublicSchema = insertEducationPublicSchema.partial().extend({
  isPublished: z.boolean().optional(),
});

// Zod Schemas - Education Personal
export const insertEducationPersonalSchema = createInsertSchema(educationPersonal, {
  prompt: z.string().min(1).max(1000),
  title: z.string().min(1).max(255),
  tags: z.array(z.string()).default([]),
  generatedContent: z.object({
    title: z.string(),
    content: z.string(),
    sections: z.array(
      z.object({
        title: z.string(),
        content: z.string(),
      })
    ),
  }),
}).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

// Type Inferences
export type ClassificationHistory = typeof classificationHistory.$inferSelect;
export type InsertClassificationHistory = typeof classificationHistory.$inferInsert;

export type EducationPublic = typeof educationPublic.$inferSelect;
export type InsertEducationPublic = typeof educationPublic.$inferInsert;
export type UpdateEducationPublic = Partial<InsertEducationPublic>;

export type EducationPersonal = typeof educationPersonal.$inferSelect;
export type InsertEducationPersonal = typeof educationPersonal.$inferInsert;
