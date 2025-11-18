// src/app/api/education/personal/[id]/generate/route.ts
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { educationPersonal } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { inngest } from "@/lib/inngest";

// POST - Regenerate content for existing personal article
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", message: "You must be logged in to regenerate articles" }, { status: 401 });
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
      return NextResponse.json({ error: "Not Found", message: "Article not found or you don't have permission to regenerate it" }, { status: 404 });
    }

    const article = existingArticle[0];

    // Update article status to indicate regeneration
    await db
      .update(educationPersonal)
      .set({
        title: "Regenerating...",
        generatedContent: {
          title: "Regenerating...",
          content: "Your content is being regenerated. Please wait a moment.",
          sections: [],
        },
        updatedAt: new Date(),
      })
      .where(eq(educationPersonal.id, id));

    // Send event to Inngest untuk regenerate content
    await inngest.send({
      name: "education/generate",
      data: {
        prompt: article.prompt,
        tags: article.tags,
        userId,
        educationPersonalId: id,
      },
    });

    return NextResponse.json(
      {
        message: "Education content regeneration started",
        data: { id },
      },
      { status: 202 } // Accepted
    );
  } catch (error) {
    console.error("Error starting education regeneration:", error);
    return NextResponse.json({ error: "Internal Server Error", message: "Failed to start regeneration" }, { status: 500 });
  }
}
