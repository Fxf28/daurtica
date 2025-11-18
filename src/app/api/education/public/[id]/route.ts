// src/app/api/education/public/[id]/route.ts
// src/app/api/education/public/[id]/route.ts
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { educationPublic } from "@/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and, not } from "drizzle-orm";
import type { UpdateEducationPublicData } from "@/types/education";

// Validation schema for update
const UpdateEducationPublicSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
  excerpt: z.string().max(500).optional(),
  isPublished: z.boolean().optional(),
});

// Helper functions (sama dengan di route.ts utama)
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

function generateExcerpt(content: string, maxLength: number = 200): string {
  const plainText = content
    .replace(/[#*`\[\]]/g, "")
    .replace(/\n/g, " ")
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.substring(0, maxLength).trim() + "...";
}

// GET - Get single article by ID
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    // Validasi ID
    if (!id) {
      return NextResponse.json({ error: "Bad Request", message: "Article ID is required" }, { status: 400 });
    }

    // Build where conditions
    const whereConditions = [eq(educationPublic.id, id)];

    // For non-authenticated users, only show published articles
    if (!userId) {
      whereConditions.push(eq(educationPublic.isPublished, true));
    }

    // Query database
    const article = await db
      .select()
      .from(educationPublic)
      .where(and(...whereConditions))
      .limit(1);

    // Check if article exists
    if (article.length === 0) {
      return NextResponse.json({ error: "Not Found", message: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Article retrieved successfully",
      data: article[0],
    });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json({ error: "Internal Server Error", message: "Failed to fetch article" }, { status: 500 });
  }
}

// PUT - Update article by ID
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", message: "You must be logged in to update articles" }, { status: 401 });
    }

    const { id } = await params;

    // Validasi ID
    if (!id) {
      return NextResponse.json({ error: "Bad Request", message: "Article ID is required" }, { status: 400 });
    }

    // Parse and validate body
    const body = await req.json();
    const validationResult = UpdateEducationPublicSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);

      return NextResponse.json(
        {
          error: "Validation Failed",
          message: "Invalid data provided",
          details: errorMessages,
        },
        { status: 400 }
      );
    }

    const { title, content, thumbnailUrl, tags, excerpt, isPublished } = validationResult.data;

    // Check if article exists and user is the author
    const existingArticle = await db
      .select()
      .from(educationPublic)
      .where(and(eq(educationPublic.id, id), eq(educationPublic.authorId, userId)))
      .limit(1);

    if (existingArticle.length === 0) {
      return NextResponse.json({ error: "Not Found", message: "Article not found or you don't have permission to update it" }, { status: 404 });
    }

    // ✅ PERBAIKAN: Prepare update data dengan type yang tepat
    const updateData: UpdateEducationPublicData = {
      updatedAt: new Date(),
    };

    if (title !== undefined) {
      updateData.title = title;

      // Generate new slug if title changed
      const newSlug = generateSlug(title);

      // Check if new slug already exists (excluding current article)
      const slugExists = await db
        .select()
        .from(educationPublic)
        .where(and(eq(educationPublic.slug, newSlug), not(eq(educationPublic.id, id))))
        .limit(1);

      if (slugExists.length === 0) {
        updateData.slug = newSlug;
      } else {
        // Jika slug sudah ada, tambahkan timestamp
        const timestamp = Date.now();
        updateData.slug = `${newSlug}-${timestamp}`;
      }
    }

    if (content !== undefined) {
      updateData.content = content;
      // Recalculate reading time
      updateData.readingTime = calculateReadingTime(content);

      // Regenerate excerpt if not explicitly provided
      if (excerpt === undefined) {
        updateData.excerpt = generateExcerpt(content);
      }
    }

    if (thumbnailUrl !== undefined) {
      updateData.thumbnailUrl = thumbnailUrl || null;
    }

    if (tags !== undefined) {
      updateData.tags = tags;
    }

    if (excerpt !== undefined) {
      updateData.excerpt = excerpt;
    }

    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
    }

    // ✅ PERBAIKAN: Pastikan hanya fields yang di-update yang dikirim
    console.log("Update data:", updateData);

    // Update article
    const [updatedArticle] = await db.update(educationPublic).set(updateData).where(eq(educationPublic.id, id)).returning();

    return NextResponse.json({
      message: "Article updated successfully",
      data: updatedArticle,
    });
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json({ error: "Internal Server Error", message: "Failed to update article" }, { status: 500 });
  }
}

// DELETE - Delete article by ID
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", message: "You must be logged in to delete articles" }, { status: 401 });
    }

    const { id } = await params;

    // Validasi ID
    if (!id) {
      return NextResponse.json({ error: "Bad Request", message: "Article ID is required" }, { status: 400 });
    }

    // Check if article exists and user is the author
    const existingArticle = await db
      .select()
      .from(educationPublic)
      .where(and(eq(educationPublic.id, id), eq(educationPublic.authorId, userId)))
      .limit(1);

    if (existingArticle.length === 0) {
      return NextResponse.json({ error: "Not Found", message: "Article not found or you don't have permission to delete it" }, { status: 404 });
    }

    // Delete article
    await db.delete(educationPublic).where(eq(educationPublic.id, id));

    return NextResponse.json({
      message: "Article deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json({ error: "Internal Server Error", message: "Failed to delete article" }, { status: 500 });
  }
}
