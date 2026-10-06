# Daurtica — Manifest Modernization (Step 4)

> **Type:** Step 4 record — web app manifest migrated to the Next.js App Router metadata convention
> **Date:** 2026-10-06
> **Branch:** `chore/modernize-pwa` (no commits made — reserved for Step 12)
> **Scope:** manifest only. No service-worker changes, caching, offline page, install prompt, update lifecycle, XSS fix, or performance work.

---

## 1. Objective

Move the web app manifest from a hand-maintained static file (`public/manifest.json`) to Next.js's typed, file-based metadata convention (`src/app/manifest.ts`) so the manifest is generated and referenced by the framework, eliminating duplicate/legacy manifest sources and keeping the definition type-checked.

## 2. Before

- **`public/manifest.json`** — the active legacy manifest (static JSON, correct branding values, referenced from `src/app/layout.tsx` via the Metadata API: `manifest: '/manifest.json'`).
- **`public/site.webmanifest`** — stale favicon-generator duplicate, already removed in Step 3 (confirmed dead).
- No `<link rel="manifest">` tag was hand-written in `layout.tsx`; the link was produced by the `metadata.manifest` value.
- No other source/config/README references to `/manifest.json` or `site.webmanifest` existed (verified by grep in Step 3/4).

## 3. After

- **`src/app/manifest.ts`** — typed manifest (`MetadataRoute.Manifest`) served by Next.js at **`/manifest.webmanifest`** (Next convention; route name verified in Next's own source `node_modules/next/dist/lib/metadata/get-metadata-route.js` → `route += '.webmanifest'`).
- The manual `manifest` key was removed from `src/app/layout.tsx` metadata. Next's static-metadata discovery (`node_modules/next/dist/build/webpack/loaders/metadata/discover.js`, line 73) generates the equivalent `manifest: "/manifest.webmanifest"` value automatically — verified empirically (see §7).
- `public/manifest.json` deleted (`git rm`). No duplicate manifest exists, and `site.webmanifest` was not restored.

## 4. Manifest Values

Values are copied **exactly** from the legacy `public/manifest.json` (no invented branding):

| Field | Value |
|---|---|
| `name` | `Daurtica - Platform Pengelolaan Sampah Berbasis AI` |
| `short_name` | `Daurtica` |
| `description` | `Klasifikasi sampah otomatis dengan AI dan edukasi pengelolaan sampah` |
| `start_url` | `/` |
| `display` | `standalone` |
| `orientation` | `portrait` |
| `background_color` | `#ffffff` |
| `theme_color` | `#16a34a` |
| `id` | `/` |
| `scope` | `/` |
| `lang` | `id` |
| `categories` | `["education", "environment", "productivity"]` |
| `icons` | see below |

**Icon declaration adaptation (documented intentionally):** the legacy manifest used the combined token `"purpose": "any maskable"`. Next's `MetadataRoute.Manifest` type only allows `'any' | 'maskable' | 'monochrome'` per icon, so the combined token cannot be expressed in a single entry without a type cast. Instead, the same semantics are preserved **spec-equivalently** by declaring each icon size twice — once with `purpose: "any"`, once with `purpose: "maskable"` — using the identical existing files/paths:

```ts
icons: [
  { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
  { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
  { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
  { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
]
```

No other field was omitted; all legacy fields are representable in `MetadataRoute.Manifest`.

## 5. Icon Verification

Physical files verified with `file` and ImageMagick `identify` before writing the manifest:

| File | Verified dimensions | Used in manifest |
|---|---|---|
| `public/android-chrome-192x192.png` | 192×192 PNG (RGBA) | ✅ `192x192` |
| `public/android-chrome-512x512.png` | 512×512 PNG | ✅ `512x512` |
| `public/apple-touch-icon.png` | 180×180 PNG | no (handled via `metadata.icons.apple` in `layout.tsx`, untouched) |
| `public/favicon-16x16.png` / `favicon-32x32.png` / `favicon.ico` / `my-favicon.ico` | 16×16, 32×32, ICO (16/32/48) | no (handled via `metadata.icons` in `layout.tsx`, untouched) |
| `public/logo.png` | 1024×1024 PNG | no (OpenGraph/Twitter/JSON-LD in `layout.tsx`, untouched) |

All manifest-referenced icon files exist with matching declared sizes. No icons were generated, renamed, or modified. No missing-icon findings.

## 6. Compatibility

- The PWA implementation remains **`@ducanh2912/next-pwa`** with the same configuration; nothing about the service worker or Workbox was changed in this step.
- **No new dependencies** were added; no Workbox CLI; `bun.lock` untouched.
- `layout.tsx` retains all other PWA/SEO metadata unchanged: `metadata.icons` (favicon + `apple-touch-icon`), `appleWebApp`, `viewport.themeColor`, OpenGraph/Twitter, `robots`, JSON-LD. Only the now-redundant `manifest: '/manifest.json'` key was removed (1 line).
- Note for Step 5 (not implemented here): `/manifest.json` used to be precached as a public asset; the new `/manifest.webmanifest` is a generated metadata route and is currently **not** covered by the SW precache. Browsers fetch it normally online; any SW caching decision for this route belongs to the Step 5 cache-strategy work.

## 7. Verification

| Check | Command | Result |
|---|---|---|
| Lint | `bun run lint` | ✅ PASS — `✔ No ESLint warnings or errors` |
| Typecheck | `bunx tsc --noEmit` | ✅ PASS — exit 0 |
| Build (normal, as-is env) | `bun run build` | ❌ FAIL — existing environment limitation: `neon()` requires `DATABASE_URL` (`.env` empty); log `/tmp/opencode/build-step4-normal.txt`. Not caused by this change; no code was altered to mask it. |
| Build (diagnostic, ephemeral placeholder env) | inline `DATABASE_URL` + Clerk/Google/Cloudinary placeholders | ✅ SUCCESS — 28/28 static pages; route table includes `○ /manifest.webmanifest 175 B`; log `/tmp/opencode/build-step4-with-env.txt` |
| Generated output | `.next/server/app/manifest.webmanifest.body` | ✅ contains exactly the JSON defined in `src/app/manifest.ts` |
| Auto link injection | `.next/server/app/index.html`, `about.html` | ✅ `<link rel="manifest" href="/manifest.webmanifest"/>` |
| Route registration | `.next/app-path-routes-manifest.json` | ✅ `"manifest.webmanifest/route": "/manifest.webmanifest"` |
| Live serve (diagnostic run, `PORT=3100`, placeholder env) | `bun run start` + `curl` | ✅ `/manifest.webmanifest` → 200 with correct JSON; `GET /about` HTML contains the manifest link tag; server stopped cleanly |
| Stale references | grep `src public README.md` (excluding generated `sw.js`/`workbox-*.js`) | ✅ **no** `/manifest.json` references; **no** `site.webmanifest` references |
| File-state assertions | `test ! -e public/manifest.json`, `test ! -e public/site.webmanifest`, `test -f src/app/manifest.ts` | ✅ all pass |

## 8. Deferred Work

Explicitly **not** implemented in this step (reserved for later steps):

- service-worker cache strategy (incl. whether/how to cache `/manifest.webmanifest`)
- offline page / fallbacks
- SW update lifecycle
- install prompt
- XSS hardening in the education renderer
- performance optimization

Also unchanged: `public/sw.js` / `public/workbox-*.js` remain generated + gitignored; no commits were made; existing working-tree changes (`bun.lock`, staged Step 3 deletions) were not reset, stashed, or reverted.
