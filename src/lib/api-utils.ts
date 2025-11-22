// lib/api-utils.ts
export function getBaseUrl() {
  // Priority 1: Environment variable
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Priority 2: Vercel environment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Priority 3: Development default
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  // Priority 4: Empty string (relative URLs)
  return "";
}
