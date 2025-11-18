// src/app/api/education/personal/route.ts
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { educationPersonal } from "@/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc, count, and, or, like, sql } from "drizzle-orm";
import { inngest } from "@/lib/inngest";

// Validation schema untuk generate request
const GenerateEducationPersonalSchema = z.object({
  prompt: z.string().min(1).max(1000),
  tags: z.array(z.string()).default([]),
});

// GET - Get user's personal education articles
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", message: "You must be logged in to access personal education" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const tag = searchParams.get("tag") || "";
    const offset = (page - 1) * limit;

    // Validasi query parameters
    if (limit > 100) {
      return NextResponse.json({ error: "Bad Request", message: "Limit cannot exceed 100" }, { status: 400 });
    }

    if (page < 1) {
      return NextResponse.json({ error: "Bad Request", message: "Page must be at least 1" }, { status: 400 });
    }

    // Alternative approach untuk where conditions
    let whereCondition;

    if (tag && search) {
      whereCondition = and(eq(educationPersonal.userId, userId), sql`${educationPersonal.tags} @> ${JSON.stringify([tag])}`, or(like(educationPersonal.prompt, `%${search}%`), like(educationPersonal.title, `%${search}%`)));
    } else if (tag) {
      whereCondition = and(eq(educationPersonal.userId, userId), sql`${educationPersonal.tags} @> ${JSON.stringify([tag])}`);
    } else if (search) {
      whereCondition = and(eq(educationPersonal.userId, userId), or(like(educationPersonal.prompt, `%${search}%`), like(educationPersonal.title, `%${search}%`)));
    } else {
      whereCondition = eq(educationPersonal.userId, userId);
    }

    // Query data
    const articles = await db.select().from(educationPersonal).where(whereCondition).orderBy(desc(educationPersonal.createdAt)).limit(limit).offset(offset);

    // Query total count
    const totalResult = await db.select({ count: count() }).from(educationPersonal).where(whereCondition);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: articles,
      pagination: {
        page,
        limit,
        offset,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching personal education articles:", error);
    return NextResponse.json({ error: "Internal Server Error", message: "Failed to fetch personal articles" }, { status: 500 });
  }
}

// POST - Generate new personal education article
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", message: "You must be logged in to generate articles" }, { status: 401 });
    }

    // Parse and validate body
    const body = await req.json();
    const validationResult = GenerateEducationPersonalSchema.safeParse(body);

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

    const { prompt, tags } = validationResult.data;

    // Create a placeholder record first
    const [placeholderRecord] = await db
      .insert(educationPersonal)
      .values({
        userId,
        prompt,
        tags,
        title: "Generating...", // Placeholder
        generatedContent: {
          title: "Generating...",
          content: "Your content is being generated. Please wait a moment.",
          sections: [],
        },
      })
      .returning();

    // Send event to Inngest untuk generate content
    await inngest.send({
      name: "education/generate",
      data: {
        prompt,
        tags,
        userId,
        educationPersonalId: placeholderRecord.id,
      },
    });

    return NextResponse.json(
      {
        message: "Education content generation started",
        data: placeholderRecord,
      },
      { status: 202 } // Accepted
    );
  } catch (error) {
    console.error("Error starting education generation:", error);
    return NextResponse.json({ error: "Internal Server Error", message: "Failed to start generation" }, { status: 500 });
  }
}
