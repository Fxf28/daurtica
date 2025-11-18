// src/app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { generateEducationContentFunction } from "@/lib/inngest/functions"; // ✅ Update import

// Create Inngest handler with all functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    generateEducationContentFunction, // ✅ Gunakan function yang baru
  ],
});
