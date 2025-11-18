// src/app/api/education/public/[id]/publish/route.ts
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { educationPublic } from "@/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

// Validation schema for publish
const PublishEducationPublicSchema = z.object({
  isPublished: z.boolean(),
});

// PATCH - Update publish status
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", message: "You must be logged in to publish articles" }, { status: 401 });
    }

    const { id } = await params;

    // Validasi ID
    if (!id) {
      return NextResponse.json({ error: "Bad Request", message: "Article ID is required" }, { status: 400 });
    }

    // Parse and validate body
    const body = await req.json();
    const validationResult = PublishEducationPublicSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Validation Failed", message: "Invalid data provided" }, { status: 400 });
    }

    const { isPublished } = validationResult.data;

    // Check if article exists and user is the author
    const existingArticle = await db
      .select()
      .from(educationPublic)
      .where(and(eq(educationPublic.id, id), eq(educationPublic.authorId, userId)))
      .limit(1);

    if (existingArticle.length === 0) {
      return NextResponse.json({ error: "Not Found", message: "Article not found or you don't have permission to publish it" }, { status: 404 });
    }

    // Update publish status
    const [updatedArticle] = await db
      .update(educationPublic)
      .set({
        isPublished,
        updatedAt: new Date(),
      })
      .where(eq(educationPublic.id, id))
      .returning();

    return NextResponse.json({
      message: `Article ${isPublished ? "published" : "unpublished"} successfully`,
      data: updatedArticle,
    });
  } catch (error) {
    console.error("Error updating article publish status:", error);
    return NextResponse.json({ error: "Internal Server Error", message: "Failed to update publish status" }, { status: 500 });
  }
}
