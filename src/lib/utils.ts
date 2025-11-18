import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string, options: { lower?: boolean; strict?: boolean; locale?: string } = {}) {
  // Gunakan parameter yang diperlukan, abaikan yang tidak digunakan
  const { lower = true, strict = false } = options;

  let slug = text
    .toString()
    .normalize("NFKD") // split accented characters into their base characters and diacritical marks
    .replace(/[\u0300-\u036f]/g, "") // remove all the accents
    .trim() // trim leading or trailing whitespace
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/[^\w\-]+/g, "") // remove all non-word chars
    .replace(/\-\-+/g, "-"); // replace multiple hyphens with single hyphen

  if (lower) {
    slug = slug.toLowerCase();
  }

  if (strict) {
    slug = slug.replace(/[^a-z0-9-]/g, "");
  }

  return slug;
}
