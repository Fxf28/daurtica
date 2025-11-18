// src/lib/gemini-ai.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GenerateEducationPersonalParams as GeminiEducationPrompt, EducationPersonalContent as GeminiEducationResponse } from "@/types/education";

// Interface untuk response JSON
interface GeminiJSONResponse {
  title: string;
  content: string;
  sections: Array<{
    title: string;
    content: string;
  }>;
}

// Fungsi untuk membersihkan dan memvalidasi JSON
function sanitizeAndParseJSON(jsonString: string): GeminiJSONResponse {
  try {
    // Hapus karakter kontrol yang tidak valid
    const cleaned = jsonString
      .replace(/[\x00-\x1F\x7F]/g, "") // Hapus karakter kontrol
      .replace(/\n/g, " ") // Ganti newline dengan spasi
      .replace(/\t/g, " ") // Ganti tab dengan spasi
      .trim();

    // Coba parse JSON
    const parsed = JSON.parse(cleaned) as GeminiJSONResponse;

    // Validasi struktur dasar
    if (typeof parsed.title !== "string" || typeof parsed.content !== "string" || !Array.isArray(parsed.sections)) {
      throw new Error("Invalid JSON structure");
    }

    return parsed;
  } catch (error) {
    console.error("JSON sanitization failed:", error);
    throw error;
  }
}

// Fungsi untuk mengekstrak JSON dari teks
function extractJSONFromText(text: string): GeminiJSONResponse {
  // Beberapa pattern untuk mengekstrak JSON
  const jsonPatterns = [
    /\{[\s\S]*\}/, // Pattern original
    /```json\n([\s\S]*?)\n```/, // Code block JSON
    /```\n([\s\S]*?)\n```/, // Code block umum
    /\{[\s\S]*\}/, // Pattern tanpa flag 's', menggunakan [\s\S] sebagai pengganti
  ];

  for (const pattern of jsonPatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const jsonString = match[1] || match[0]; // Ambil group 1 atau seluruh match
        return sanitizeAndParseJSON(jsonString);
      } catch (parseError) {
        console.warn(`${parseError}: Pattern ${pattern.toString()} failed, trying next...`);
        continue;
      }
    }
  }

  throw new Error("No valid JSON found in response");
}

export async function generateEducationContent(promptData: GeminiEducationPrompt): Promise<GeminiEducationResponse> {
  const { prompt, tags = [] } = promptData;

  if (!process.env.GOOGLE_API_KEY) {
    console.log("Using mock Gemini AI - GOOGLE_API_KEY not set");
    return await mockGeminiGenerate(prompt);
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `
You are an environmental education expert. Create comprehensive educational content about waste management in Indonesian.

USER PROMPT: ${prompt}
TAGS: ${tags.join(", ")}

Please generate content with this structure:
- Title: Clear and engaging title in Indonesian
- Content: Comprehensive markdown content in Indonesian with proper sections
- Sections: 3-4 sections with titles and detailed content

IMPORTANT: Return ONLY valid JSON format without any additional text, markdown formatting, or code blocks.

Format the response as JSON:
{
  "title": "string",
  "content": "string (markdown)",
  "sections": [
    {"title": "string", "content": "string"},
    {"title": "string", "content": "string"}
  ]
}

Ensure the content is:
- Educational and factual
- Written in Indonesian
- Practical and actionable
- Related to waste management and environmental sustainability
`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    console.log("Raw Gemini response:", text); // Debug log

    try {
      const jsonData = extractJSONFromText(text);
      // Convert to expected response type
      return {
        title: jsonData.title,
        content: jsonData.content,
        sections: jsonData.sections,
      };
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      console.log("Raw response that failed:", text);

      // Fallback jika parsing gagal
      return createFallbackContent(prompt, tags);
    }
  } catch (error) {
    console.error("Gemini AI API error:", error);
    return await mockGeminiGenerate(prompt);
  }
}

// Mock function untuk development
async function mockGeminiGenerate(prompt: string): Promise<GeminiEducationResponse> {
  // Simulate AI processing time
  await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000));

  const topics = ["pentingnya pengelolaan sampah", "dampak lingkungan", "cara daur ulang", "manfaat ekonomi", "tips sehari-hari"];

  const randomTopic = topics[Math.floor(Math.random() * topics.length)];

  return {
    title: `Panduan Lengkap: ${prompt}`,
    content: `# ${prompt}\n\nArtikel ini membahas secara mendalam tentang ${prompt} dan kaitannya dengan ${randomTopic}. Dalam era modern ini, kesadaran akan ${prompt} menjadi semakin penting untuk kelestarian lingkungan kita.\n\n## Mengapa ${prompt} Penting?\n\n${prompt} memainkan peran krusial dalam menjaga keseimbangan ekosistem. Dengan memahami konsep ${prompt}, kita dapat berkontribusi lebih baik untuk masa depan yang berkelanjutan.\n\n## Langkah Praktis\n\nBerikut adalah beberapa langkah yang dapat Anda terapkan dalam kehidupan sehari-hari terkait ${prompt}.`,
    sections: [
      {
        title: "Pengenalan dan Konsep Dasar",
        content: `Memahami ${prompt} dari dasar sangat penting untuk penerapan yang efektif. Bagian ini akan menjelaskan fundamental dari ${prompt} dan bagaimana hal tersebut berkontribusi pada lingkungan yang lebih baik.`,
      },
      {
        title: "Manfaat dan Dampak Positif",
        content: `Penerapan ${prompt} yang tepat dapat membawa berbagai manfaat, baik untuk lingkungan maupun kehidupan sehari-hari. Mari eksplorasi dampak positif yang bisa kita rasakan.`,
      },
      {
        title: "Cara Implementasi Praktis",
        content: `Bagian ini memberikan panduan langkah demi langkah untuk mengimplementasikan ${prompt} dalam aktivitas harian Anda dengan mudah dan efektif.`,
      },
    ],
  };
}

function createFallbackContent(prompt: string, tags: string[]): GeminiEducationResponse {
  return {
    title: `Panduan: ${prompt}`,
    content: `# ${prompt}\n\nKonten edukasi tentang ${prompt}.${
      tags.length > 0 ? ` Topik terkait: ${tags.join(", ")}.` : ""
    }\n\nArtikel ini memberikan pemahaman mendalam tentang pentingnya ${prompt} dalam konteks pengelolaan sampah dan pelestarian lingkungan.`,
    sections: [
      {
        title: "Pengenalan",
        content: `Pengenalan tentang ${prompt} dan relevansinya dengan kehidupan sehari-hari.`,
      },
      {
        title: "Pentingnya",
        content: `Mengapa ${prompt} menjadi hal yang krusial untuk dipahami dan diterapkan.`,
      },
      {
        title: "Cara Menerapkan",
        content: `Langkah-langkah praktis untuk menerapkan ${prompt} dalam aktivitas harian.`,
      },
    ],
  };
}
