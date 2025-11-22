// app/api/education/public/route.ts
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { educationPublic } from "@/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc, count, and, or, like, sql } from "drizzle-orm";
import { uploadToCloudinary } from "@/lib/cloudinary"; // ✅ IMPORT CLOUDINARY

// Validation schemas
const CreateEducationPublicSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  thumbnailUrl: z.string().optional().or(z.literal("")),
  tags: z.array(z.string()).default([]),
  excerpt: z.string().max(500).optional(),
  isPublished: z.boolean().default(false),
});

// Helper function untuk generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Helper function untuk calculate reading time
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// Helper function untuk generate excerpt
function generateExcerpt(content: string, maxLength: number = 200): string {
  const plainText = content
    .replace(/[#*`\[\]]/g, "")
    .replace(/\n/g, " ")
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.substring(0, maxLength).trim() + "...";
}

// GET - Get articles dengan berbagai filter (TETAP SAMA)
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const tag = searchParams.get("tag") || "";
    const authorId = searchParams.get("authorId") || "";
    const publishedOnly = searchParams.get("publishedOnly") === "true";
    const offset = (page - 1) * limit;

    // Validasi query parameters
    if (limit > 100) {
      return NextResponse.json({ error: "Bad Request", message: "Limit cannot exceed 100" }, { status: 400 });
    }

    if (page < 1) {
      return NextResponse.json({ error: "Bad Request", message: "Page must be at least 1" }, { status: 400 });
    }

    // Build where conditions
    const whereConditions = [];

    // Filter by publish status
    if (publishedOnly || !userId) {
      whereConditions.push(eq(educationPublic.isPublished, true));
    }

    // Filter by author
    if (authorId) {
      whereConditions.push(eq(educationPublic.authorId, authorId));
    }

    // Filter by tag
    if (tag) {
      whereConditions.push(sql`${educationPublic.tags} @> ${JSON.stringify([tag])}`);
    }

    // Search in title and content
    if (search) {
      whereConditions.push(or(like(educationPublic.title, `%${search}%`), like(educationPublic.excerpt, `%${search}%`), like(educationPublic.content, `%${search}%`)));
    }

    // Query data dengan kondisi
    const articles = await db
      .select()
      .from(educationPublic)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(educationPublic.createdAt))
      .limit(limit)
      .offset(offset);

    // Query total count
    const totalResult = await db
      .select({ count: count() })
      .from(educationPublic)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      data: articles,
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
    console.error("Error fetching education articles:", error);
    return NextResponse.json({ error: "Internal Server Error", message: "Failed to fetch articles" }, { status: 500 });
  }
}

// POST - Create new article dengan Cloudinary upload
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", message: "You must be logged in to create articles" }, { status: 401 });
    }

    // Check Content-Type
    const contentType = req.headers.get("content-type") || "";

    let body;
    let thumbnailFile: File | null = null;
    let cloudinaryPublicId: string | null = null;
    let finalThumbnailUrl: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      // Handle FormData dengan upload gambar
      const formData = await req.formData();

      // Ambil file thumbnail jika ada
      thumbnailFile = formData.get("thumbnail") as File;

      // Ambil field lainnya
      const title = formData.get("title") as string;
      const content = formData.get("content") as string;
      const tags = formData.get("tags") as string;
      const excerpt = formData.get("excerpt") as string;
      const isPublished = formData.get("isPublished") as string;

      // Validasi field required
      if (!title || !content) {
        return NextResponse.json({ error: "Missing required fields", message: "Title and content are required" }, { status: 400 });
      }

      body = {
        title,
        content,
        tags: tags ? JSON.parse(tags) : [],
        excerpt: excerpt || undefined,
        isPublished: isPublished ? isPublished === "true" : false,
        thumbnailUrl: "", // Sementara kosong, akan diisi setelah upload Cloudinary
      };

      // Upload ke Cloudinary jika ada file
      if (thumbnailFile && thumbnailFile.size > 0) {
        try {
          const uploadResult = await uploadToCloudinary(thumbnailFile);
          finalThumbnailUrl = uploadResult.secure_url;
          cloudinaryPublicId = uploadResult.public_id;
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
          return NextResponse.json({ error: "Image Upload Failed", message: "Failed to upload thumbnail to Cloudinary" }, { status: 500 });
        }
      }
    } else {
      // Handle JSON request (untuk kompatibilitas backward)
      try {
        body = await req.json();
      } catch (parseError) {
        console.error("Failed to parse request JSON:", parseError);
        return NextResponse.json({ error: "Invalid JSON", message: "Request body must be valid JSON" }, { status: 400 });
      }

      finalThumbnailUrl = body.thumbnailUrl || null;
    }

    // Validasi body
    const validationResult = CreateEducationPublicSchema.safeParse(body);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);

      return NextResponse.json(
        {
          error: "Validation Failed",
          message: "Invalid data provided",
          details: errorMessages,
        },
        { status: 400 }
      );
    }

    const { title, content, tags, excerpt, isPublished } = validationResult.data;

    // Generate slug from title
    const slug = generateSlug(title);

    // Check if slug already exists
    const existingArticle = await db.select().from(educationPublic).where(eq(educationPublic.slug, slug)).limit(1);

    if (existingArticle.length > 0) {
      return NextResponse.json({ error: "Duplicate Slug", message: "An article with this title already exists" }, { status: 409 });
    }

    // Calculate reading time dan generate excerpt
    const readingTime = calculateReadingTime(content);
    const finalExcerpt = excerpt || generateExcerpt(content);

    // Insert article
    const [article] = await db
      .insert(educationPublic)
      .values({
        title,
        slug,
        content,
        thumbnailUrl: finalThumbnailUrl,
        cloudinaryPublicId, // ✅ Simpan public_id dari Cloudinary
        authorId: userId,
        tags,
        excerpt: finalExcerpt,
        readingTime,
        isPublished,
      })
      .returning();

    return NextResponse.json(
      {
        message: "Article created successfully",
        data: article,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json({ error: "Internal Server Error", message: "Failed to create article" }, { status: 500 });
  }
}
