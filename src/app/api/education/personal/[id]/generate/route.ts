import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { educationPersonal, userGenerateUsage } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { inngest } from "@/lib/inngest";

// Helper function untuk check dan update usage (sama dengan di route utama)
async function checkAndUpdateGenerateUsage(userId: string): Promise<{ allowed: boolean; count: number; limit: number }> {
  const today = new Date().toISOString().split("T")[0];
  const limit = 10;

  try {
    const existingUsage = await db
      .select()
      .from(userGenerateUsage)
      .where(and(eq(userGenerateUsage.userId, userId), eq(userGenerateUsage.date, today)))
      .limit(1);

    if (existingUsage.length === 0) {
      await db.insert(userGenerateUsage).values({
        userId,
        date: today,
        count: 1,
        lastGeneratedAt: new Date(),
      });

      return { allowed: true, count: 1, limit };
    }

    const usage = existingUsage[0];

    if (usage.count >= limit) {
      return { allowed: false, count: usage.count, limit };
    }

    await db
      .update(userGenerateUsage)
      .set({
        count: usage.count + 1,
        lastGeneratedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userGenerateUsage.id, usage.id));

    return { allowed: true, count: usage.count + 1, limit };
  } catch (error) {
    console.error("Error checking generate usage:", error);
    return { allowed: true, count: 0, limit };
  }
}

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

    // Check generate usage limit untuk regenerate juga
    const usageCheck = await checkAndUpdateGenerateUsage(userId);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: "Limit Exceeded",
          message: `Anda telah mencapai batas generate hari ini. Maksimal ${usageCheck.limit} generate per hari.`,
          details: {
            currentCount: usageCheck.count,
            limit: usageCheck.limit,
            resetTime: "00:00 WIB",
          },
        },
        { status: 429 }
      );
    }

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
        usage: {
          current: usageCheck.count,
          limit: usageCheck.limit,
          remaining: usageCheck.limit - usageCheck.count,
        },
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("Error starting education regeneration:", error);
    return NextResponse.json({ error: "Internal Server Error", message: "Failed to start regeneration" }, { status: 500 });
  }
}
