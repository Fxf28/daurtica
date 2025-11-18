// src/app/api/education/personal/[id]/route.ts
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { educationPersonal } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

// GET - Get single personal article by ID
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", message: "You must be logged in to access this resource" }, { status: 401 });
    }

    const { id } = await params;

    // Validasi ID
    if (!id) {
      return NextResponse.json({ error: "Bad Request", message: "Article ID is required" }, { status: 400 });
    }

    // Query database untuk mendapatkan article by ID dan user ID
    const article = await db
      .select()
      .from(educationPersonal)
      .where(and(eq(educationPersonal.id, id), eq(educationPersonal.userId, userId)))
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
    console.error("Error fetching personal article:", error);
    return NextResponse.json({ error: "Internal Server Error", message: "Failed to fetch article" }, { status: 500 });
  }
}

// DELETE - Delete personal article by ID
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

    // Check if article exists and user is the owner
    const existingArticle = await db
      .select()
      .from(educationPersonal)
      .where(and(eq(educationPersonal.id, id), eq(educationPersonal.userId, userId)))
      .limit(1);

    if (existingArticle.length === 0) {
      return NextResponse.json({ error: "Not Found", message: "Article not found or you don't have permission to delete it" }, { status: 404 });
    }

    // Delete article
    await db.delete(educationPersonal).where(eq(educationPersonal.id, id));

    return NextResponse.json({
      message: "Article deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting personal article:", error);
    return NextResponse.json({ error: "Internal Server Error", message: "Failed to delete article" }, { status: 500 });
  }
}
