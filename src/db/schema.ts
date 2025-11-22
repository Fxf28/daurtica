import { pgTable, text, uuid, jsonb, timestamp, numeric, integer, varchar, boolean, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Classification History Schema
export const classificationHistory = pgTable("classification_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  imageUrl: text("image_url"),
  cloudinaryPublicId: text("cloudinary_public_id"), // Tambahkan field baru
  topLabel: text("top_label").notNull(),
  confidence: numeric("confidence", { precision: 5, scale: 4 }).notNull(),
  allResults: jsonb("all_results").notNull(),
  source: text("source").notNull(),
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
  cloudinaryPublicId: varchar("cloudinary_public_id", { length: 500 }), // ✅ TAMBAHKAN INI
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
  imageUrl: z.url().optional().or(z.literal("")),
  cloudinaryPublicId: z.string().optional(), // Tambahkan ke Zod schema
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
  thumbnailUrl: z.string().optional().or(z.literal("")), // ✅ Ubah dari url() ke string()
  cloudinaryPublicId: z.string().optional(), // ✅ TAMBAHKAN INI
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

// table baru untuk tracking generate usage
export const userGenerateUsage = pgTable("user_generate_usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // Format: YYYY-MM-DD
  count: integer("count").default(0).notNull(),
  lastGeneratedAt: timestamp("last_generated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Buat unique constraint untuk user dan date
export const userGenerateUsageRelations = pgTable;

// Tambahkan table waste_banks
export const wasteBanks = pgTable("waste_banks", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  openingHours: text("opening_hours"),
  description: text("description"),
  typesAccepted: jsonb("types_accepted").default("[]"), // jenis sampah yang diterima
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by", { length: 255 }).notNull(), // user ID admin yang membuat
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod schemas
export const insertWasteBankSchema = createInsertSchema(wasteBanks, {
  name: z.string().min(1).max(255),
  address: z.string().min(1),
  latitude: z.string().or(z.number()),
  longitude: z.string().or(z.number()),
  phone: z.string().optional(),
  email: z.email().optional().or(z.literal("")),
  website: z.url().optional().or(z.literal("")),
  openingHours: z.string().optional(),
  description: z.string().optional(),
  typesAccepted: z.array(z.string()).default([]),
}).omit({
  id: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
});

export const updateWasteBankSchema = insertWasteBankSchema.partial();

// Type inferences
export type WasteBank = typeof wasteBanks.$inferSelect;
export type InsertWasteBank = typeof wasteBanks.$inferInsert;
export type UpdateWasteBank = Partial<InsertWasteBank>;
