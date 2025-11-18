// src/app/api/education/public/slug/[slug]/route.ts
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { educationPublic } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

// GET - Get article by slug
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { userId } = await auth();
    const { slug } = await params;

    // Validasi slug
    if (!slug) {
      return NextResponse.json({ error: "Bad Request", message: "Article slug is required" }, { status: 400 });
    }

    // Build where conditions
    const whereConditions = [eq(educationPublic.slug, slug)];

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
    console.error("Error fetching article by slug:", error);
    return NextResponse.json({ error: "Internal Server Error", message: "Failed to fetch article" }, { status: 500 });
  }
}
