import { db } from "@/db";
import { wasteBanks } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";

// GET - Get waste banks near a location
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");
    const radius = parseFloat(searchParams.get("radius") || "10"); // dalam km
    const limit = parseInt(searchParams.get("limit") || "20");

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: "Valid latitude and longitude are required" }, { status: 400 });
    }

    // Haversine formula untuk menghitung distance
    const banks = await db
      .select({
        id: wasteBanks.id,
        name: wasteBanks.name,
        address: wasteBanks.address,
        latitude: wasteBanks.latitude,
        longitude: wasteBanks.longitude,
        phone: wasteBanks.phone,
        email: wasteBanks.email,
        website: wasteBanks.website,
        openingHours: wasteBanks.openingHours,
        description: wasteBanks.description,
        typesAccepted: wasteBanks.typesAccepted,
        distance: sql<number>`
          (6371 * acos(cos(radians(${lat})) * cos(radians(CAST(${wasteBanks.latitude} AS DECIMAL))) * 
          cos(radians(CAST(${wasteBanks.longitude} AS DECIMAL)) - radians(${lng})) + 
          sin(radians(${lat})) * sin(radians(CAST(${wasteBanks.latitude} AS DECIMAL)))))
        `.as("distance"),
      })
      .from(wasteBanks)
      .where(
        and(
          eq(wasteBanks.isActive, true),
          sql`(6371 * acos(cos(radians(${lat})) * cos(radians(CAST(${wasteBanks.latitude} AS DECIMAL))) * 
          cos(radians(CAST(${wasteBanks.longitude} AS DECIMAL)) - radians(${lng})) + 
          sin(radians(${lat})) * sin(radians(CAST(${wasteBanks.latitude} AS DECIMAL))))) <= ${radius}`
        )
      )
      .orderBy(sql`distance`)
      .limit(limit);

    return NextResponse.json({ data: banks });
  } catch (error) {
    console.error("Error fetching nearby waste banks:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
