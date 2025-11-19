import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { wasteBanks } from "@/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc, count, and, or, like, SQL } from "drizzle-orm";

// Validation schema
const CreateWasteBankSchema = z.object({
  name: z.string().min(1).max(255),
  address: z.string().min(1),
  latitude: z.string().or(z.number()),
  longitude: z.string().or(z.number()),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  openingHours: z.string().optional(),
  description: z.string().optional(),
  typesAccepted: z.array(z.string()).default([]),
});

// GET - Get all waste banks (public)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    // Build where condition safely
    const whereConditions = [eq(wasteBanks.isActive, true)];

    if (search) {
      whereConditions.push(or(like(wasteBanks.name, `%${search}%`), like(wasteBanks.address, `%${search}%`)) as SQL);
    }

    const banks = await db
      .select()
      .from(wasteBanks)
      .where(and(...whereConditions))
      .orderBy(desc(wasteBanks.createdAt))
      .limit(limit)
      .offset(offset);

    const totalResult = await db
      .select({ count: count() })
      .from(wasteBanks)
      .where(and(...whereConditions));

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: banks,
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
    console.error("Error fetching waste banks:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST - Create new waste bank (admin only)
export async function POST(req: Request) {
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

    const body = await req.json();
    const validationResult = CreateWasteBankSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ error: "Validation Failed", details: validationResult.error.issues }, { status: 400 });
    }

    const { name, address, latitude, longitude, phone, email, website, openingHours, description, typesAccepted } = validationResult.data;

    const [newBank] = await db
      .insert(wasteBanks)
      .values({
        name,
        address,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        phone,
        email,
        website,
        openingHours,
        description,
        typesAccepted,
        createdBy: userId,
      })
      .returning();

    return NextResponse.json({ message: "Waste bank created", data: newBank }, { status: 201 });
  } catch (error) {
    console.error("Error creating waste bank:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
