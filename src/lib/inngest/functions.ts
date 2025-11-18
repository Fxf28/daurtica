// src/lib/inngest/functions.ts
import { inngest } from "@/lib/inngest";
import { db } from "@/db";
import { educationPersonal } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { generateEducationContent as generateWithGemini } from "@/lib/gemini-ai";
import type { EducationPersonalContent } from "@/types/education"; // ✅ Gunakan type yang ada

// Event schemas untuk type safety
const GenerateEventSchema = z.object({
  prompt: z.string(),
  tags: z.array(z.string()).optional(),
  userId: z.string(),
  educationPersonalId: z.string().optional(),
});

// Mock function menggunakan type yang sudah ada
async function mockGeminiGenerate(prompt: string): Promise<EducationPersonalContent> {
  const processingTime = 2000 + Math.random() * 3000;
  await new Promise((resolve) => setTimeout(resolve, processingTime));

  const topics = ["pentingnya pengelolaan sampah", "dampak lingkungan", "cara daur ulang", "manfaat ekonomi", "tips sehari-hari"];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];

  return {
    title: `Panduan Lengkap: ${prompt.split(" ").slice(0, 4).join(" ")}`,
    content: `# ${prompt}\n\nArtikel ini membahas secara mendalam tentang ${prompt} dan kaitannya dengan ${randomTopic}.`,
    sections: [
      {
        title: "Pengenalan dan Konsep Dasar",
        content: `Memahami ${prompt} dari dasar sangat penting untuk penerapan yang efektif.`,
      },
      {
        title: "Manfaat dan Dampak Positif",
        content: `Penerapan ${prompt} yang tepat dapat membawa berbagai manfaat.`,
      },
      {
        title: "Cara Implementasi Praktis",
        content: `Bagian ini memberikan panduan langkah demi langkah untuk mengimplementasikan ${prompt}.`,
      },
    ],
  };
}

export const generateEducationContentFunction = inngest.createFunction(
  {
    id: "generate-education-content",
    concurrency: {
      limit: 3,
      key: "event.data.userId",
    },
    retries: 2,
  },
  { event: "education/generate" },
  async ({ event, step }) => {
    const validationResult = GenerateEventSchema.safeParse(event.data);
    if (!validationResult.success) {
      throw new Error(`Invalid event data: ${validationResult.error.message}`);
    }

    const { prompt, tags, userId, educationPersonalId } = validationResult.data;

    try {
      // Step 1: Generate content - return type EducationPersonalContent
      const generatedContent: EducationPersonalContent = await step.run("generate-content", async () => {
        console.log(`Generating content for user ${userId}, prompt: ${prompt}`);

        try {
          return await generateWithGemini({ prompt, tags: tags || [] });
        } catch (error) {
          console.error("Gemini AI failed, using mock:", error);
          return await mockGeminiGenerate(prompt);
        }
      });

      // Step 2: Save to database - menggunakan type yang konsisten
      const educationRecord = await step.run("save-to-database", async () => {
        if (educationPersonalId) {
          // Update existing record
          const [updated] = await db
            .update(educationPersonal)
            .set({
              title: generatedContent.title,
              generatedContent, // ✅ Type sudah match dengan database schema
              updatedAt: new Date(),
            })
            .where(eq(educationPersonal.id, educationPersonalId))
            .returning();

          return updated;
        } else {
          // Create new record
          const [created] = await db
            .insert(educationPersonal)
            .values({
              userId,
              prompt,
              generatedContent, // ✅ Type sudah match
              title: generatedContent.title,
              tags: tags || [],
            })
            .returning();

          return created;
        }
      });

      // Step 3: Send completion event
      await step.sendEvent("send-completion", {
        name: "education/generate.completed",
        data: {
          educationPersonalId: educationRecord.id,
          content: generatedContent,
          userId,
        },
      });

      console.log(`Successfully generated content for record: ${educationRecord.id}`);

      return {
        success: true,
        educationPersonalId: educationRecord.id,
        content: generatedContent,
      };
    } catch (error) {
      console.error(`Error in generateEducationContent for user ${userId}:`, error);

      // Step 4: Handle errors - update record dengan status error
      if (educationPersonalId) {
        try {
          await db
            .update(educationPersonal)
            .set({
              title: "Generation Failed",
              generatedContent: {
                title: "Generation Failed",
                content: `Maaf, terjadi kesalahan saat menghasilkan konten. Silakan coba lagi. Error: ${error instanceof Error ? error.message : "Unknown error"}`,
                sections: [],
              },
              updatedAt: new Date(),
            })
            .where(eq(educationPersonal.id, educationPersonalId));
        } catch (dbError) {
          console.error("Failed to update record with error status:", dbError);
        }
      }

      // Send error event
      await step.sendEvent("send-error", {
        name: "education/generate.failed",
        data: {
          educationPersonalId,
          error: error instanceof Error ? error.message : "Unknown error",
          prompt,
          userId,
        },
      });

      throw error;
    }
  }
);
