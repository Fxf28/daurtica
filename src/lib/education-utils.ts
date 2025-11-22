// src/lib/education-utils.ts

import { InsertEducationPublic } from "@/db/schema";
import { slugify } from "@/lib/utils";

export function generateSlug(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
  });
}

export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

export function generateExcerpt(content: string, maxLength: number = 200): string {
  const plainText = content
    .replace(/[#*`\[\]]/g, "")
    .replace(/\n/g, " ")
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.substring(0, maxLength).trim() + "...";
}

export function prepareEducationPublicData(
  data: Omit<InsertEducationPublic, "slug" | "authorId" | "readingTime" | "excerpt"> & {
    title: string;
    authorId: string;
  }
) {
  const slug = generateSlug(data.title);
  const readingTime = calculateReadingTime(data.content);
  const excerpt = generateExcerpt(data.content);

  return {
    ...data,
    slug,
    readingTime,
    excerpt,
  } as InsertEducationPublic;
}

// Helper untuk generate tags dari prompt/content
export function extractTagsFromText(text: string, existingTags: string[] = []): string[] {
  const commonTags = ["sampah", "daur ulang", "lingkungan", "organik", "plastik", "kertas", "logam", "kaca"];
  const words = text.toLowerCase().split(/\s+/);

  const foundTags = commonTags.filter((tag) => words.some((word) => word.includes(tag)));

  return [...new Set([...foundTags, ...existingTags])].slice(0, 10); // Max 10 tags
}
