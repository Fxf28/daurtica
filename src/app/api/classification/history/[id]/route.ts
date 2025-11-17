// app/api/classification/history/[id]/route.ts
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { classificationHistory } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

// GET - Get single classification history by ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // params adalah Promise
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", message: "You must be logged in to access this resource" }, { status: 401 });
    }

    const { id } = await params; // AWAIT params

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

    return NextResponse.json({
      message: "Classification history retrieved successfully",
      data: history[0],
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

// DELETE - Delete classification history by ID
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // params adalah Promise
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", message: "You must be logged in to delete classification history" }, { status: 401 });
    }

    const { id } = await params; // AWAIT params

    // Validasi ID
    if (!id) {
      return NextResponse.json({ error: "Bad Request", message: "Classification ID is required" }, { status: 400 });
    }

    // Query database untuk menghapus history by ID dan user ID
    const deletedHistory = await db
      .delete(classificationHistory)
      .where(and(eq(classificationHistory.id, id), eq(classificationHistory.userId, userId)))
      .returning();

    // Cek jika history tidak ditemukan
    if (deletedHistory.length === 0) {
      return NextResponse.json({ error: "Not Found", message: "Classification history not found or you don't have permission to delete it" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Classification history deleted successfully",
      data: deletedHistory[0],
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
