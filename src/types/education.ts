// src/types/education.ts

// Education Public Types
export interface EducationPublic {
  id: string;
  title: string;
  slug: string;
  content: string;
  thumbnailUrl?: string | null;
  authorId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  tags: string[];
  isPublished: boolean;
  excerpt?: string | null;
  readingTime?: number | null;
}

export interface CreateEducationPublic {
  title: string;
  slug: string;
  content: string;
  thumbnailUrl?: string;
  tags?: string[];
  excerpt?: string;
  readingTime?: number;
}

export interface UpdateEducationPublic {
  title?: string;
  slug?: string;
  content?: string;
  thumbnailUrl?: string;
  tags?: string[];
  excerpt?: string;
  readingTime?: number;
  isPublished?: boolean;
}

export interface EducationPublicForm {
  title: string;
  slug: string;
  content: string;
  thumbnailUrl?: string;
  tags: string[];
  excerpt?: string;
  readingTime?: number;
  isPublished: boolean;
}

export interface EducationPublicListResponse {
  data: EducationPublic[];
  pagination: {
    page: number;
    limit: number;
    offset: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface EducationPublicFormData {
  title: string;
  content: string;
  thumbnailUrl?: string;
  excerpt?: string;
  tags: string[];
  isPublished: boolean;
}

export interface EducationPublicFilters {
  search?: string;
  tags?: string[];
  isPublished?: boolean;
  authorId?: string;
}

export type UpdateEducationPublicData = Partial<{
  title: string;
  slug: string;
  content: string;
  thumbnailUrl: string | null;
  tags: string[] | null;
  excerpt: string | null;
  readingTime: number | null;
  isPublished: boolean;
  updatedAt: Date;
}>;

// Education Personal Types
export interface EducationPersonalSection {
  title: string;
  content: string;
}

export interface EducationPersonalContent {
  title: string;
  content: string;
  sections: EducationPersonalSection[];
}

export interface EducationPersonal {
  id: string;
  userId: string;
  prompt: string;
  generatedContent: EducationPersonalContent;
  title: string;
  tags: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface GenerateEducationPersonal {
  prompt: string;
  tags?: string[];
}

export interface EducationPersonalForm {
  prompt: string;
  tags: string[];
}

export type GenerateEducationPersonalParams = GenerateEducationPersonal;

export type EducationPersonalFilters = {
  page?: number;
  limit?: number;
  search?: string;
  tag?: string;
};

export interface EducationPersonalListResponse {
  data: EducationPersonal[];
  pagination: {
    page: number;
    limit: number;
    offset: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
