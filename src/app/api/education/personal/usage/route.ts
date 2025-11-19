import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { userGenerateUsage } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0];
    const limit = 10;

    // Cari record usage untuk user hari ini
    const existingUsage = await db
      .select()
      .from(userGenerateUsage)
      .where(and(eq(userGenerateUsage.userId, userId), eq(userGenerateUsage.date, today)))
      .limit(1);

    let current = 0;
    if (existingUsage.length > 0) {
      current = existingUsage[0].count;
    }

    return NextResponse.json({
      current,
      limit,
      remaining: limit - current,
    });
  } catch (error) {
    console.error("Error fetching usage:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
