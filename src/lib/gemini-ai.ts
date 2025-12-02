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

export interface QuickTipResponse {
  title: string;
  category: "Organik" | "Anorganik" | "B3" | "Residu";
  action: "Kompos" | "Daur Ulang" | "Bank Sampah" | "Buang di TPA" | "Khusus (B3)";
  tips: string[];
  funFact: string;
}

// Fungsi untuk membersihkan dan memvalidasi JSON
function sanitizeAndParseJSON<T>(jsonString: string): T {
  try {
    const cleaned = jsonString
      .replace(/[\x00-\x1F\x7F]/g, "")
      .replace(/\n/g, " ")
      .replace(/\t/g, " ")
      .trim();

    const parsed = JSON.parse(cleaned) as T;

    // HAPUS validasi spesifik di sini karena struktur JSON kini bisa beragam.
    // Validasi akan dilakukan oleh pemanggil fungsi jika perlu.

    return parsed;
  } catch (error) {
    console.error("JSON sanitization failed:", error);
    throw error;
  }
}

// Fungsi untuk mengekstrak JSON dari teks
function extractJSONFromText<T>(text: string): T {
  const jsonPatterns = [/\{[\s\S]*\}/, /```json\n([\s\S]*?)\n```/, /```\n([\s\S]*?)\n```/];

  for (const pattern of jsonPatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const jsonString = match[1] || match[0];
        // Pass tipe generic T ke fungsi sanitasi
        return sanitizeAndParseJSON<T>(jsonString);
      } catch (parseError) {
        console.warn(`${parseError}: Pattern ${pattern.toString()} failed, trying next...`);
        continue;
      }
    }
  }

  throw new Error("No valid JSON found in response");
}

// Improved error handling untuk Gemini API
export async function generateEducationContent(promptData: GeminiEducationPrompt): Promise<GeminiEducationResponse> {
  const { prompt, tags = [] } = promptData;

  if (!process.env.GOOGLE_API_KEY) {
    console.log("Using mock Gemini AI - GOOGLE_API_KEY not set");
    return await mockGeminiGenerate(prompt);
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-lite",
      generationConfig: {
        maxOutputTokens: 2000, // Batasi output untuk mengurangi load
        temperature: 0.7,
      },
    });

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

    // Tambahkan timeout untuk request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 detik timeout

    try {
      const result = await model.generateContent(systemPrompt);
      clearTimeout(timeoutId);

      const response = await result.response;
      const text = response.text();

      try {
        const jsonData = extractJSONFromText<GeminiJSONResponse>(text);

        if (!jsonData.content || !Array.isArray(jsonData.sections)) {
          throw new Error("Invalid structure for Education Content");
        }
        // Convert to expected response type
        return {
          title: jsonData.title,
          content: jsonData.content,
          sections: jsonData.sections,
        };
      } catch (parseError) {
        console.error("Failed to parse Gemini response as JSON:", parseError);
        return createFallbackContent(prompt, tags);
      }
    } catch (timeoutError) {
      console.error("Gemini AI request timeout:", timeoutError);
      throw new Error("Request timeout - model mungkin sedang overload");
    }
  } catch (error) {
    console.error("Gemini AI API error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes("503") || error.message.includes("overload")) {
        throw new Error("Model sedang overload. Silakan coba lagi dalam beberapa saat.");
      } else if (error.message.includes("429") || error.message.includes("rate limit")) {
        throw new Error("Rate limit exceeded. Silakan coba lagi nanti.");
      } else if (error.message.includes("timeout")) {
        throw new Error("Request timeout. Model sedang sibuk, silakan coba lagi.");
      }
    }

    throw error; // Re-throw error untuk ditangani oleh retry mechanism
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

// ==========================================
// UPDATE: QUICK TIPS (POPUP) - ADJUSTED FOR LABELS
// ==========================================

export async function generateQuickTips(rawLabel: string): Promise<QuickTipResponse> {
  // 1. Bersihkan label dari snake_case (contoh: "light_bulbs_tubes" -> "light bulbs tubes")
  const cleanLabel = rawLabel.replace(/_/g, " ").toLowerCase();

  if (!process.env.GOOGLE_API_KEY) {
    return {
      title: cleanLabel,
      category: "Anorganik",
      action: "Daur Ulang",
      tips: ["Bersihkan sampah", "Pisahkan dari jenis lain", "Setorkan ke pengepul"],
      funFact: "Data simulasi (API Key tidak ditemukan).",
    };
  }

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    generationConfig: { temperature: 0.3 }, // Lebih rendah agar lebih strict soal kategori
  });

  // Prompt khusus yang memetakan label bahasa Inggris Anda ke Konteks Indonesia
  const prompt = `
    Bertindaklah sebagai ahli pengelolaan sampah di Indonesia.
    Berikan saran pengelolaan singkat untuk jenis sampah: "${cleanLabel}".

    PANDUAN KATEGORI BERDASARKAN INPUT:
    - "cardboard", "paper" -> Anorganik (Kardus/Kertas)
    - "glass", "metal", "plastic" -> Anorganik (Daur Ulang)
    - "food organics", "vegetation" -> Organik (Kompos)
    - "textile trash" -> Anorganik/Residu
    - "batteries", "light bulbs tubes", "mercury thermometers", "pesticide containers", "ointment" -> B3 (Bahan Berbahaya & Beracun)
    - "miscellaneous trash" -> Residu

    TUGAS:
    Outputkan JSON valid (tanpa markdown) dengan struktur berikut:
    {
      "title": "Terjemahan nama sampah ke Bahasa Indonesia yang umum (contoh: light bulbs -> Lampu Bohlam)",
      "category": "Pilih satu: Organik / Anorganik / B3 / Residu",
      "action": "Pilih satu: Kompos / Daur Ulang / Bank Sampah / Buang di TPA / Khusus (B3)",
      "tips": ["3 langkah singkat, padat, praktis cara mengelolanya (cuci/pilah/aman)"],
      "funFact": "1 fakta unik edukatif tentang sampah ini (maks 1 kalimat)"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Panggil dengan tipe QuickTipResponse agar TypeScript mengenali propertinya
    const json = extractJSONFromText<QuickTipResponse>(text);

    // Sekarang TypeScript tidak akan error lagi di sini:
    return {
      title: json.title || cleanLabel,
      category: json.category || "Anorganik",
      action: json.action || "Daur Ulang",
      tips: Array.isArray(json.tips) ? json.tips : ["Kelola dengan bijak"],
      funFact: json.funFact || "",
    };
  } catch (error) {
    console.error("Error generating quick tips:", error);
    throw new Error("Gagal memuat saran AI");
  }
}
