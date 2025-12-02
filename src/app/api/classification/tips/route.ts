import { NextResponse } from "next/server";
import { generateQuickTips } from "@/lib/gemini-ai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { label } = body;

    // Tambahkan validasi label
    if (!label) {
      return NextResponse.json({ error: "Label is required" }, { status: 400 });
    }

    const tips = await generateQuickTips(label);
    return NextResponse.json(tips);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to generate tips" }, { status: 500 });
  }
}
