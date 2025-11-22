// app/api/classification/history/[id]/route.ts
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { classificationHistory } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import type { ClassificationHistoryDB, TransformedClassificationHistory } from "@/types/classification";
import { deleteFromCloudinary } from "@/lib/cloudinary"; // IMPORT DELETE FUNCTION

// Helper function untuk transform data dengan type safety - TAMBAH cloudinaryPublicId
function transformClassificationData(item: ClassificationHistoryDB): TransformedClassificationHistory {
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
    // cloudinaryPublicId akan otomatis termasuk jika ada di item
  };
}

// ✅ GET - Get single classification history by ID
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", message: "You must be logged in to access this resource" }, { status: 401 });
    }

    const { id } = await params;

    // Validasi ID
    if (!id) {
      return NextResponse.json({ error: "Bad Request", message: "Classification ID is required" }, { status: 400 });
    }

    // Query database untuk mendapatkan history by ID dan user ID
    const history = await db
      .select()
      .from(classificationHistory)
      .where(and(eq(classificationHistory.id, id), eq(classificationHistory.userId, userId)))
      .limit(1);

    // Cek jika history tidak ditemukan
    if (history.length === 0) {
      return NextResponse.json({ error: "Not Found", message: "Classification history not found" }, { status: 404 });
    }

    // ✅ TRANSFORM DATA: Convert confidence dari string ke number dengan type safety
    const dbData: ClassificationHistoryDB = history[0];
    const transformedData = transformClassificationData(dbData);

    return NextResponse.json({
      message: "Classification history retrieved successfully",
      data: transformedData,
    });
  } catch (error) {
    console.error("Error fetching classification history:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("invalid input syntax for type uuid")) {
        return NextResponse.json({ error: "Bad Request", message: "Invalid classification ID format" }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "Internal Server Error", message: "Failed to fetch classification history" }, { status: 500 });
  }
}

// ✅ DELETE - Delete classification history by ID DENGAN HAPUS DI CLOUDINARY
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", message: "You must be logged in to delete classification history" }, { status: 401 });
    }

    const { id } = await params;

    // Validasi ID
    if (!id) {
      return NextResponse.json({ error: "Bad Request", message: "Classification ID is required" }, { status: 400 });
    }

    // Ambil data terlebih dahulu untuk mendapatkan cloudinaryPublicId
    const existingHistory = await db
      .select()
      .from(classificationHistory)
      .where(and(eq(classificationHistory.id, id), eq(classificationHistory.userId, userId)))
      .limit(1);

    // Cek jika history tidak ditemukan
    if (existingHistory.length === 0) {
      return NextResponse.json({ error: "Not Found", message: "Classification history not found or you don't have permission to delete it" }, { status: 404 });
    }

    const historyToDelete = existingHistory[0];

    // Hapus gambar dari Cloudinary jika ada cloudinaryPublicId
    if (historyToDelete.cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(historyToDelete.cloudinaryPublicId);
        console.log(`Deleted image from Cloudinary: ${historyToDelete.cloudinaryPublicId}`);
      } catch (cloudinaryError) {
        console.error("Error deleting image from Cloudinary:", cloudinaryError);
        // Lanjutkan penghapusan data meskipun gagal hapus di Cloudinary
      }
    }

    // Query database untuk menghapus history by ID dan user ID
    const deletedHistory = await db
      .delete(classificationHistory)
      .where(and(eq(classificationHistory.id, id), eq(classificationHistory.userId, userId)))
      .returning();

    // ✅ TRANSFORM DATA: Convert confidence dari string ke number untuk response dengan type safety
    const dbData: ClassificationHistoryDB = deletedHistory[0];
    const transformedData = transformClassificationData(dbData);

    return NextResponse.json({
      message: "Classification history deleted successfully",
      data: transformedData,
    });
  } catch (error) {
    console.error("Error deleting classification history:", error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes("invalid input syntax for type uuid")) {
        return NextResponse.json({ error: "Bad Request", message: "Invalid classification ID format" }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "Internal Server Error", message: "Failed to delete classification history" }, { status: 500 });
  }
}
