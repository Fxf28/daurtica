// src/lib/inngest.ts
import { Inngest } from "inngest";
import { z } from "zod";

// Initialize Inngest
export const inngest = new Inngest({
  id: "daurtica-education",
  eventKey: process.env.INNGEST_EVENT_KEY || "local-dev-key",
});

// Event definitions
export const events = {
  "education/generate": {
    name: "education/generate",
    data: z.object({
      prompt: z.string(),
      tags: z.array(z.string()).optional(),
      userId: z.string(),
      educationPersonalId: z.string().optional(),
    }),
  },
  "education/generate.completed": {
    name: "education/generate.completed",
    data: z.object({
      educationPersonalId: z.string(),
      content: z.object({
        title: z.string(),
        content: z.string(),
        sections: z.array(
          z.object({
            title: z.string(),
            content: z.string(),
          })
        ),
      }),
      userId: z.string(),
    }),
  },
  "education/generate.failed": {
    name: "education/generate.failed",
    data: z.object({
      educationPersonalId: z.string().optional(),
      error: z.string(),
      prompt: z.string(),
      userId: z.string(),
    }),
  },
};
