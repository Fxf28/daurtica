import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { wasteBanks } from "@/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

const UpdateWasteBankSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  address: z.string().min(1).optional(),
  latitude: z.string().or(z.number()).optional(),
  longitude: z.string().or(z.number()).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  openingHours: z.string().optional(),
  description: z.string().optional(),
  typesAccepted: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

interface ProcessedUpdateData {
  name?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  phone?: string;
  email?: string;
  website?: string;
  openingHours?: string;
  description?: string;
  typesAccepted?: string[];
  isActive?: boolean;
  updatedAt: Date;
}

// GET - Get waste bank by ID (public)
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const bank = await db
      .select()
      .from(wasteBanks)
      .where(and(eq(wasteBanks.id, id), eq(wasteBanks.isActive, true)))
      .limit(1);

    if (bank.length === 0) {
      return NextResponse.json({ error: "Waste bank not found" }, { status: 404 });
    }

    return NextResponse.json({ data: bank[0] });
  } catch (error) {
    console.error("Error fetching waste bank:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT - Update waste bank (admin only)
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin using currentUser
    const user = await currentUser();
    if (user?.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const validationResult = UpdateWasteBankSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Validation Failed", details: validationResult.error.issues }, { status: 400 });
    }

    const updateData = validationResult.data;

    // Convert lat/long to string if provided with proper typing
    const processedData: ProcessedUpdateData = {
      updatedAt: new Date(),
    };

    // Copy all properties with type safety
    if (updateData.name !== undefined) processedData.name = updateData.name;
    if (updateData.address !== undefined) processedData.address = updateData.address;
    if (updateData.phone !== undefined) processedData.phone = updateData.phone;
    if (updateData.email !== undefined) processedData.email = updateData.email;
    if (updateData.website !== undefined) processedData.website = updateData.website;
    if (updateData.openingHours !== undefined) processedData.openingHours = updateData.openingHours;
    if (updateData.description !== undefined) processedData.description = updateData.description;
    if (updateData.typesAccepted !== undefined) processedData.typesAccepted = updateData.typesAccepted;
    if (updateData.isActive !== undefined) processedData.isActive = updateData.isActive;

    // Handle latitude and longitude conversion
    if (updateData.latitude !== undefined) {
      processedData.latitude = updateData.latitude.toString();
    }
    if (updateData.longitude !== undefined) {
      processedData.longitude = updateData.longitude.toString();
    }

    const [updatedBank] = await db.update(wasteBanks).set(processedData).where(eq(wasteBanks.id, id)).returning();

    if (!updatedBank) {
      return NextResponse.json({ error: "Waste bank not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Waste bank updated", data: updatedBank });
  } catch (error) {
    console.error("Error updating waste bank:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE - Soft delete waste bank (admin only)
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin using currentUser
    const user = await currentUser();
    if (user?.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    const [deletedBank] = await db.update(wasteBanks).set({ isActive: false, updatedAt: new Date() }).where(eq(wasteBanks.id, id)).returning();

    if (!deletedBank) {
      return NextResponse.json({ error: "Waste bank not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Waste bank deleted" });
  } catch (error) {
    console.error("Error deleting waste bank:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
