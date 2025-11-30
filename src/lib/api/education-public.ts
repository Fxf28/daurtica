// src/lib/api/education-public.ts
import { z } from "zod";
import { getBaseUrl } from "../api-utils";

// Response schemas
export const EducationPublicResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  content: z.string().optional().or(z.literal("")), // ✅ Boleh kosong untuk List View
  thumbnailUrl: z.string().nullable(),
  cloudinaryPublicId: z.string().nullable().optional(),
  authorId: z.string(),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()).optional(), // ✅ Optional
  tags: z.array(z.string()).default([]),
  isPublished: z.boolean().optional(), // ✅ Optional
  excerpt: z.string().nullable(),
  readingTime: z.number().nullable().optional(), // ✅ Optional
});

export const EducationPublicListResponseSchema = z.object({
  data: z.array(EducationPublicResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    offset: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPrevPage: z.boolean(),
  }),
});

// Types untuk API calls - UPDATE untuk terima File
export type CreateEducationPublicParams = {
  title: string;
  content: string;
  thumbnailFile?: File; // ✅ Ubah dari thumbnailUrl ke thumbnailFile
  tags?: string[];
  excerpt?: string;
  isPublished?: boolean;
};

export type UpdateEducationPublicParams = Partial<CreateEducationPublicParams>;

export type EducationPublicFilters = {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
  authorId?: string;
  publishedOnly?: boolean;
};

// API functions
export async function getEducationPublicList(filters: EducationPublicFilters = {}) {
  const { page = 1, limit = 12, ...restFilters } = filters;
  const baseUrl = getBaseUrl();

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...Object.entries(restFilters).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        acc[key] = value.toString();
      }
      return acc;
    }, {} as Record<string, string>),
  });

  const response = await fetch(`${baseUrl}/api/education/public?${queryParams}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  const validatedResult = EducationPublicListResponseSchema.safeParse(result);

  if (!validatedResult.success) {
    throw new Error("Invalid response from server");
  }

  return validatedResult.data;
}

export async function getEducationPublicById(id: string) {
  const response = await fetch(`/api/education/public/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  const validatedResult = EducationPublicResponseSchema.safeParse(result.data);

  if (!validatedResult.success) {
    throw new Error("Invalid response from server");
  }

  return validatedResult.data;
}

// lib/api/education-public.ts
export async function getEducationPublicBySlug(slug: string) {
  try {
    const baseUrl = getBaseUrl();
    const apiUrl = `${baseUrl}/api/education/public/slug/${slug}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Article not found (404)");
        return null;
      }

      const errorText = await response.text();
      console.error("API Error response:", errorText);

      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const result = await response.json();
    // Validasi response
    const validatedResult = EducationPublicResponseSchema.safeParse(result.data);

    if (!validatedResult.success) {
      console.error("Validation error:", validatedResult.error);
      throw new Error("Invalid response format from server");
    }

    return validatedResult.data;
  } catch (error) {
    console.error("Error in getEducationPublicBySlug:", error);
    throw error;
  }
}

// API functions - UPDATE create dan update functions
export async function createEducationPublic(data: CreateEducationPublicParams) {
  const formData = new FormData();

  formData.append("title", data.title);
  formData.append("content", data.content);

  if (data.thumbnailFile) {
    formData.append("thumbnail", data.thumbnailFile);
  }

  if (data.tags) {
    formData.append("tags", JSON.stringify(data.tags));
  }

  if (data.excerpt) {
    formData.append("excerpt", data.excerpt);
  }

  formData.append("isPublished", (data.isPublished || false).toString());

  const response = await fetch("/api/education/public", {
    method: "POST",
    body: formData, // ✅ Gunakan FormData, bukan JSON
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  const validatedResult = EducationPublicResponseSchema.safeParse(result.data);

  if (!validatedResult.success) {
    throw new Error("Invalid response from server");
  }

  return validatedResult.data;
}

// Pastikan fungsi updateEducationPublic tidak mengirim thumbnailUrl yang tidak perlu
export async function updateEducationPublic(id: string, data: UpdateEducationPublicParams) {
  const formData = new FormData();

  if (data.title) formData.append("title", data.title);
  if (data.content) formData.append("content", data.content);

  // ✅ PERBAIKAN: Hanya append thumbnailFile jika ada
  if (data.thumbnailFile) {
    formData.append("thumbnail", data.thumbnailFile);
  }

  if (data.tags) formData.append("tags", JSON.stringify(data.tags));
  if (data.excerpt) formData.append("excerpt", data.excerpt);
  if (data.isPublished !== undefined) formData.append("isPublished", data.isPublished.toString());

  const response = await fetch(`/api/education/public/${id}`, {
    method: "PUT",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  const validatedResult = EducationPublicResponseSchema.safeParse(result.data);

  if (!validatedResult.success) {
    throw new Error("Invalid response from server");
  }

  return validatedResult.data;
}

export async function deleteEducationPublic(id: string) {
  const response = await fetch(`/api/education/public/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return { success: true };
}

export async function togglePublishEducationPublic(id: string, isPublished: boolean) {
  const response = await fetch(`/api/education/public/${id}/publish`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isPublished }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  const validatedResult = EducationPublicResponseSchema.safeParse(result.data);

  if (!validatedResult.success) {
    throw new Error("Invalid response from server");
  }

  return validatedResult.data;
}
