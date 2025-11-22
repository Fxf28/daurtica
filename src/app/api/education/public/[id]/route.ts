// src/app/api/education/public/[id]/route.ts
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { educationPublic } from "@/db/schema";
import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
import { UpdateEducationPublicData } from "@/types/education";

// Validation schema untuk update
const UpdateEducationPublicSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  thumbnailUrl: z.string().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
  excerpt: z.string().max(500).optional(),
  isPublished: z.boolean().optional(),
});

// Helper functions
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

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

// GET - Get single article
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const article = await db.select().from(educationPublic).where(eq(educationPublic.id, id)).limit(1);

    if (article.length === 0) {
      return NextResponse.json({ error: "Not Found", message: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Article retrieved successfully",
      data: article[0],
    });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json({ error: "Internal Server Error", message: "Failed to fetch article" }, { status: 500 });
  }
}

// PUT - Update article dengan Cloudinary
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", message: "You must be logged in to update articles" }, { status: 401 });
    }

    const { id } = await params;

    // Check if article exists and user is the author
    const existingArticle = await db
      .select()
      .from(educationPublic)
      .where(and(eq(educationPublic.id, id), eq(educationPublic.authorId, userId)))
      .limit(1);

    if (existingArticle.length === 0) {
      return NextResponse.json({ error: "Not Found", message: "Article not found or you don't have permission to update it" }, { status: 404 });
    }

    const currentArticle = existingArticle[0];

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

      body = {
        ...(title && { title }),
        ...(content && { content }),
        ...(tags && { tags: JSON.parse(tags) }),
        ...(excerpt && { excerpt }),
        ...(isPublished && { isPublished: isPublished === "true" }),
        // JANGAN set thumbnailUrl ke string kosong, biarkan undefined
      };

      // ✅ PERBAIKAN: Upload ke Cloudinary hanya jika ada file baru
      if (thumbnailFile && thumbnailFile.size > 0) {
        try {
          // Hapus gambar lama jika ada
          if (currentArticle.cloudinaryPublicId) {
            await deleteFromCloudinary(currentArticle.cloudinaryPublicId);
          }

          const uploadResult = await uploadToCloudinary(thumbnailFile);
          finalThumbnailUrl = uploadResult.secure_url;
          cloudinaryPublicId = uploadResult.public_id;
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
          return NextResponse.json({ error: "Image Upload Failed", message: "Failed to upload thumbnail to Cloudinary" }, { status: 500 });
        }
      }
    } else {
      // Handle JSON request
      try {
        body = await req.json();
      } catch (parseError) {
        console.error("Failed to parse request JSON:", parseError);
        return NextResponse.json({ error: "Invalid JSON", message: "Request body must be valid JSON" }, { status: 400 });
      }

      // ✅ PERBAIKAN: Jangan set finalThumbnailUrl ke null untuk JSON request
      // Biarkan menggunakan thumbnail yang sudah ada
    }

    // Validasi body
    const validationResult = UpdateEducationPublicSchema.safeParse(body);
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

    // Prepare data for update
    const updateData: UpdateEducationPublicData = {
      updatedAt: new Date(),
    };

    if (title) {
      updateData.title = title;
      updateData.slug = generateSlug(title);
    }

    if (content) {
      updateData.content = content;
      updateData.readingTime = calculateReadingTime(content);
      updateData.excerpt = excerpt || generateExcerpt(content);
    }

    if (tags) {
      updateData.tags = tags;
    }

    if (excerpt) {
      updateData.excerpt = excerpt;
    }

    if (typeof isPublished === "boolean") {
      updateData.isPublished = isPublished;
    }

    // ✅ PERBAIKAN: Update thumbnail hanya jika ada file baru
    if (finalThumbnailUrl) {
      updateData.thumbnailUrl = finalThumbnailUrl;
      updateData.cloudinaryPublicId = cloudinaryPublicId;
    }
    // Jika tidak ada file baru, thumbnail tetap menggunakan yang lama

    // Update article
    const [updatedArticle] = await db.update(educationPublic).set(updateData).where(eq(educationPublic.id, id)).returning();

    return NextResponse.json({
      message: "Article updated successfully",
      data: updatedArticle,
    });
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json({ error: "Internal Server Error", message: "Failed to update article" }, { status: 500 });
  }
}

// DELETE - Delete article dengan hapus dari Cloudinary
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", message: "You must be logged in to delete articles" }, { status: 401 });
    }

    const { id } = await params;

    // Check if article exists and user is the author
    const existingArticle = await db
      .select()
      .from(educationPublic)
      .where(and(eq(educationPublic.id, id), eq(educationPublic.authorId, userId)))
      .limit(1);

    if (existingArticle.length === 0) {
      return NextResponse.json({ error: "Not Found", message: "Article not found or you don't have permission to delete it" }, { status: 404 });
    }

    // Hapus gambar dari Cloudinary jika ada
    if (existingArticle[0].cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(existingArticle[0].cloudinaryPublicId);
      } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
        // Lanjutkan penghapusan artikel meskipun gagal hapus gambar
      }
    }

    // Hapus artikel
    await db.delete(educationPublic).where(eq(educationPublic.id, id));

    return NextResponse.json({
      message: "Article deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json({ error: "Internal Server Error", message: "Failed to delete article" }, { status: 500 });
  }
}
