import { inngest } from "@/lib/inngest";
import { db } from "@/db";
import { educationPersonal } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { generateEducationContent as generateWithGemini } from "@/lib/gemini-ai";
import type { EducationPersonalContent } from "@/types/education";

// Event schemas untuk type safety
const GenerateEventSchema = z.object({
  prompt: z.string(),
  tags: z.array(z.string()).optional(),
  userId: z.string(),
  educationPersonalId: z.string().optional(),
});

// Helper function untuk delay dengan exponential backoff
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry mechanism dengan exponential backoff
async function retryWithBackoff<T>(operation: () => Promise<T>, maxRetries: number = 3, baseDelay: number = 1000): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Check jika error adalah model overload (503) atau rate limit (429)
      const isOverloadError = error instanceof Error && (error.message.includes("503") || error.message.includes("overload") || error.message.includes("429") || error.message.includes("rate limit"));

      // Jika bukan overload error atau sudah mencapai max retries, throw error
      if (!isOverloadError || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff dengan jitter
      const delayTime = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.warn(`Model overloaded, retrying in ${Math.round(delayTime)}ms (attempt ${attempt}/${maxRetries})`);

      await delay(delayTime);
    }
  }

  throw lastError!;
}

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
      limit: 2, // Kurangi concurrency limit untuk mengurangi overload
      key: "event.data.userId",
    },
    retries: 5, // Tingkatkan retries untuk handle overload
  },
  { event: "education/generate" },
  async ({ event, step }) => {
    const validationResult = GenerateEventSchema.safeParse(event.data);
    if (!validationResult.success) {
      throw new Error(`Invalid event data: ${validationResult.error.message}`);
    }

    const { prompt, tags, userId, educationPersonalId } = validationResult.data;

    try {
      // Step 1: Generate content dengan retry mechanism
      const generatedContent: EducationPersonalContent = await step.run("generate-content", async () => {
        console.log(`Generating content for user ${userId}, prompt: ${prompt}`);

        try {
          // Gunakan retry mechanism untuk handle overload
          return await retryWithBackoff(
            () => generateWithGemini({ prompt, tags: tags || [] }),
            3, // max retries
            2000 // base delay 2 detik
          );
        } catch (error) {
          console.error("Gemini AI failed after retries, using mock:", error);
          return await mockGeminiGenerate(prompt);
        }
      });

      // Step 2: Save to database
      const educationRecord = await step.run("save-to-database", async () => {
        if (educationPersonalId) {
          // Update existing record
          const [updated] = await db
            .update(educationPersonal)
            .set({
              title: generatedContent.title,
              generatedContent,
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
              generatedContent,
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
              title: "Generation Failed - Model Overloaded",
              generatedContent: {
                title: "Generation Failed",
                content: `Maaf, model AI sedang overload. Silakan coba lagi dalam beberapa saat. \n\nError: ${error instanceof Error ? error.message : "Unknown error"}`,
                sections: [
                  {
                    title: "Saran",
                    content: "Silakan coba regenerate konten ini nanti, atau gunakan prompt yang berbeda.",
                  },
                ],
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
