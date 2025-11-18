// src/lib/api/education-public.ts
import { z } from "zod";

// Response schemas
export const EducationPublicResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  thumbnailUrl: z.string().nullable(),
  authorId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  tags: z.array(z.string()),
  isPublished: z.boolean(),
  excerpt: z.string().nullable(),
  readingTime: z.number().nullable(),
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

// Types untuk API calls
export type CreateEducationPublicParams = {
  title: string;
  content: string;
  thumbnailUrl?: string;
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

  const response = await fetch(`/api/education/public?${queryParams}`, {
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

export async function getEducationPublicBySlug(slug: string) {
  const response = await fetch(`/api/education/public/slug/${slug}`, {
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

export async function createEducationPublic(data: CreateEducationPublicParams) {
  const response = await fetch("/api/education/public", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
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

export async function updateEducationPublic(id: string, data: UpdateEducationPublicParams) {
  const response = await fetch(`/api/education/public/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
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
