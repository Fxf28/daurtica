// app/api/classification/history/route.ts
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { classificationHistory } from "@/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc, count } from "drizzle-orm";
import type { ClassificationHistoryDB, TransformedClassificationHistory } from "@/types/classification";

// Validation schema
const CreateClassificationSchema = z.object({
  imageUrl: z.string().url().optional().or(z.literal("")),
  topLabel: z.string().min(1, "Top label is required"),
  confidence: z.number().min(0).max(1, "Confidence must be between 0 and 1"),
  allResults: z
    .array(
      z.object({
        label: z.string(),
        confidence: z.number(),
      })
    )
    .min(1, "At least one result is required"),
  source: z.enum(["camera", "upload"]),
  processingTime: z.number().int().positive().optional(),
  imageSize: z.number().int().positive().optional(),
  deviceType: z.string().optional(),
});

// Helper function untuk transform data dengan type safety
function transformClassificationData(item: ClassificationHistoryDB): TransformedClassificationHistory {
  // Handle allResults dengan type guard
  const allResults = Array.isArray(item.allResults)
    ? item.allResults.map((result: unknown) => {
        if (result && typeof result === "object" && "label" in result && "confidence" in result) {
          const confidenceValue = (result as { confidence: unknown }).confidence;
          return {
            label: String((result as { label: unknown }).label),
            confidence: typeof confidenceValue === "string" ? parseFloat(confidenceValue) : typeof confidenceValue === "number" ? confidenceValue : 0,
          };
        }
        return { label: "Unknown", confidence: 0 };
      })
    : [];

  return {
    ...item,
    confidence: parseFloat(item.confidence),
    allResults,
  };
}

// ✅ POST - Create new classification history
export async function POST(req: Request) {
  try {
    // --- Authentication ---
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", message: "You must be logged in to save classification history" }, { status: 401 });
    }

    // --- Body Parsing & Validation ---
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request JSON:", parseError);
      return NextResponse.json({ error: "Invalid JSON", message: "Request body must be valid JSON" }, { status: 400 });
    }

    // Zod validation
    const validationResult = CreateClassificationSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map((err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`);

      return NextResponse.json(
        {
          error: "Validation Failed",
          message: "Invalid data provided",
          details: errorMessages,
        },
        { status: 400 }
      );
    }

    const { imageUrl, topLabel, confidence, allResults, source, processingTime, imageSize, deviceType } = validationResult.data;

    // --- Database Insert ---
    const result = await db
      .insert(classificationHistory)
      .values({
        userId,
        imageUrl: imageUrl || null,
        topLabel,
        confidence: confidence.toString(),
        allResults,
        source,
        processingTime: processingTime || null,
        imageSize: imageSize || null,
        deviceType: deviceType || null,
      })
      .returning();

    // --- Transform data untuk response ---
    const dbData: ClassificationHistoryDB = result[0];
    const responseData = transformClassificationData(dbData);

    // --- Success Response ---
    return NextResponse.json(
      {
        message: "Classification history saved successfully",
        data: responseData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving classification history:", error);

    // Database error handling
    if (error instanceof Error) {
      if (error.message.includes("violates foreign key constraint")) {
        return NextResponse.json({ error: "Database Error", message: "User not found" }, { status: 400 });
      }
    }

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to save classification history",
      },
      { status: 500 }
    );
  }
}

// ✅ GET - Get paginated classification history (TANPA params.id)
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const offset = (page - 1) * limit;

    // Validasi query parameters
    if (limit > 100) {
      return NextResponse.json({ error: "Bad Request", message: "Limit cannot exceed 100" }, { status: 400 });
    }

    if (page < 1) {
      return NextResponse.json({ error: "Bad Request", message: "Page must be at least 1" }, { status: 400 });
    }

    // Query untuk data
    const history = await db.select().from(classificationHistory).where(eq(classificationHistory.userId, userId)).orderBy(desc(classificationHistory.createdAt)).limit(limit).offset(offset);

    // Query untuk total count
    const totalResult = await db.select({ count: count() }).from(classificationHistory).where(eq(classificationHistory.userId, userId));

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    // ✅ TRANSFORM DATA: Convert confidence dari string ke number dengan type safety
    const transformedHistory: TransformedClassificationHistory[] = history.map((item: ClassificationHistoryDB) => transformClassificationData(item));

    return NextResponse.json({
      data: transformedHistory,
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
    console.error("Error fetching classification history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
