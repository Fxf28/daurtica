# Daurtica — Offline UX & Deterministic Fallback (Phase 6)

> **Type:** Phase 6 record — offline document fallback and offline page
> **Date:** 2026-10-06
> **Branch:** `chore/modernize-pwa` (no commits made — reserved for the later commit phase)
> **Scope:** document/navigation offline fallback only. No install prompt, SW update UX, XSS work, or performance work.
> **Related docs:** `docs/pwa-cache-strategy.md` (Phase 5 — locked runtime cache policy), `docs/modernization-audit.md` (§R4), `docs/modernization-manifest.md`

---

## 1. Offline UX goal

Before this phase, an offline navigation to any document other than `/` ended on the browser's generic network error page. Phase 6 makes offline document navigation **deterministic**:

> Network unavailable → the service worker intercepts the document request → the user sees the Daurtica offline page at `/~offline`, at the URL they requested.

Non-goals (deliberately unchanged): API behavior, private/dashboard data handling, authentication, database, AI classification, install prompt, SW update lifecycle, XSS remediation, performance work.

## 2. Offline page location

| Item | Value |
|---|---|
| File | `src/app/~offline/page.tsx` (App Router, client component) |
| URL | `/~offline` (static, prerendered at build: `○ /~offline`) |
| Layout | Root layout only — the page lives outside the `(public)` route group, so it renders without Navbar/Footer |
| Texts | Heading **"Kamu sedang offline"** · description **"Periksa koneksi internetmu dan coba lagi."** · retry button **"Coba lagi"** |
| Dependencies | None at runtime: no API, database, Clerk calls, Gemini, TensorFlow.js, Cloudinary, external images, external JavaScript, or external fonts (Geist is self-hosted by `next/font` and its files are build assets; icon is bundled `lucide-react`). |
| Styling | Existing design system only (`Button`, Tailwind theme tokens: `bg-card`, `text-muted-foreground`, `border`, `rounded-xl`). No new UI library, no new dependency, no animation. |

The retry handler is a one-liner (`window.location.reload()`) — no state management, no polling, no reconnect loop.

## 3. PWA fallback mechanism (verified against the installed package)

All statements below were verified by reading the installed `@ducanh2912/next-pwa@10.2.9` sources (`dist/index.js`, `dist/fallback.js`, `dist/index.d.ts`) and by inspecting the generated `public/sw.js` — not from memory or another version's docs.

### 3.1 What the plugin does automatically

1. **Auto-detection.** When `fallbacks.document` is not set, `getDefaultDocumentPage()` looks for `src/app/~offline/page.{tsx,ts,jsx,js}` (or `pages/_offline.*`) and uses `/~offline` as the document fallback route. The build log confirms: `This app will fallback to these precached routes when fetching from the cache and the network fails: Documents (pages): /~offline`.
2. **Fallback worker.** The plugin compiles `public/fallback-<hash>.js` and adds it to `importScripts`. It defines `self.fallback(request)`:
   - `destination === "document"` → `caches.match("/~offline", { ignoreSearch: true })`
   - any other destination (image/audio/video/font/data not configured) → `Response.error()`
   The generated file contains literally `document:"/~offline"`.
3. **Precache.** The fallback route is appended to the precache manifest: `{ url: "/~offline", revision: <buildId> }`.
4. **handlerDidError injection.** The plugin injects `handlerDidError: async ({ request }) => self.fallback(request)` into every `runtimeCaching` entry that **has an `options` object** and no `precacheFallback`.

### 3.2 The gap that had to be closed

Phase 5 supplied a custom `runtimeCaching` array, so the plugin's default runtime routes were **replaced** (`resolveRuntimeCaching`, `extendDefaultRuntimeCaching=false`). The default set contained a `pages` NetworkFirst route matching generic same-origin navigations; the Phase 5 custom set has no such route. Consequence:

- Creating `src/app/~offline/page.tsx` alone is **not sufficient**: no runtime route matches an offline navigation to e.g. `/faq`, so no Workbox handler (and therefore no injected `handlerDidError`) ever runs, and the browser would still show its generic error page.

### 3.3 The Phase 6 configuration change (`next.config.ts`)

Exactly one runtime route was added (rule 9), placed after `/dashboard/**` and `/api/**`:

```ts
{
  urlPattern: ({ request, sameOrigin }) =>
    sameOrigin && request.destination === "document",
  handler: "NetworkOnly",
  options: {}, // presence of `options` lets the plugin inject handlerDidError
},
```

- **No caching is added**: the strategy is `NetworkOnly`; no `cacheName`, no `ExpirationPlugin`. Documents still never enter Cache Storage.
- The empty `options` object is intentional and is the supported switch for the plugin's `handlerDidError` injection (§3.1.4).
- Explicit `fallbacks.document` is **not** required — auto-detection is the package's documented, source-verified convention, so it is used and documented here rather than duplicated in config.
- The old cross-origin catch-all comment was renumbered 9 → 10. No other rule was touched.

## 4. Why the fallback is deterministic

- `/~offline` (HTML) is fetched by Workbox **during service-worker install** (online) and stored in Cache Storage under the workbox precache.
- At failure time, `self.fallback` resolves the fallback from **Cache Storage** (`caches.match(..., { ignoreSearch: true })`) — it never fetches the fallback page from the network.
- The offline page's JS chunk (and every `/_next/static/**` asset, including CSS and font preloads) is part of the same build-time precache manifest (131 entries), so hydration offline uses precached assets only.
- If the precache entry were missing, the handler returns `Response.error()` — the same outcome as a normal failed navigation. No hang, no loop.

## 5. Navigation behavior

```
User requests a document
        ↓
Service Worker (route 14: same-origin GET, destination=document)
        ↓
Network available?
   ┌────┴────┐
   │         │
  YES       NO
   │         │
   ↓         ↓
Normal    NetworkOnly throws
page         │
             ↓
     handlerDidError → self.fallback(request)
             │
             ↓
     caches.match("/~offline", { ignoreSearch: true })
             │
             ↓
         /~offline  (precached HTML, URL stays as requested)
```

- **Online:** document navigations pass through the SW untouched (`NetworkOnly`) and pages load normally. No document is cached.
- **Offline:** the precached `/~offline` HTML is served **at the requested URL** (e.g. the address bar still shows `/faq`).
- **`/`** keeps the plugin's `dynamicStartUrl` NetworkFirst route (Phase 5, unchanged): offline it may serve the previously cached landing HTML, otherwise the fallback.
- **APIs:** unchanged. Public education/waste-banks NetworkFirst rules may serve cached public JSON offline (Phase 5 behavior); every other `/api/**` remains NetworkOnly and fails without an offline HTML substitute.
- **Private:** `/dashboard/**`, `/api/inngest/**`, and all cross-origin auth/Clerk requests remain `NetworkOnly`. An offline `/dashboard` navigation ends on the browser error page — **not** the offline page. This is deliberate: no fallback for private/dashboard navigation, and private HTML is never cached.
- **Mutations:** the four first-position POST/PUT/PATCH/DELETE `NetworkOnly` guards are untouched.

### Explicit guarantees

- **API requests are NOT converted into offline HTML.** For non-document destinations `self.fallback` returns `Response.error()` (no data/image/audio/video/font fallbacks are configured), so API calls still reject exactly like a network failure.
- **Private data remains NetworkOnly.** No private endpoint or document is cached or served from cache.
- **Dashboard remains NetworkOnly.** Rule 11 is byte-for-byte the Phase 5 rule, placed before the document route.
- **Authentication remains NetworkOnly.** All cross-origin Clerk/FAPI traffic hits the final catch-all with no options and no fallback; same-origin auth endpoints fall under `/api/**`.

## 6. How the offline page becomes available to the service worker

| Step | Artifact |
|---|---|
| Build | Next.js prerenders `/~offline` to static HTML (`.next/server/app/~offline.html`) |
| Plugin | Detects `src/app/~offline/page.tsx`, sets document fallback `/~offline`, compiles `public/fallback-<hash>.js` |
| SW generation | `importScripts("/fallback-<hash>.js")` + precache entry `{url:"/~offline", revision:<buildId>}` + the page's `/_next/static/chunks/app/~offline/page-*.js` chunk |
| Install (online) | Workbox precaches all 131 manifest entries, including `/~offline` HTML, its chunk, CSS, and the fallback worker itself |
| Offline failure | `caches.match("/~offline", { ignoreSearch: true })` returns the precached HTML; the page chunk is served from the same precache |

Generated files (`public/sw.js`, `public/workbox-*.js`, `public/fallback-*.js`) are build artifacts, are never hand-edited, and are gitignored (`public/fallback-*.js` was added to `.gitignore` in this phase).

## 7. Retry behavior

```
Coba lagi
   ↓
window.location.reload()   (document navigation)
   ↓
Network available?
   ├─ YES → original requested URL loads normally
   └─ NO  → SW returns the precached /~offline again (page remains usable)
```

No polling, no automatic reconnect, no connectivity API calls. Deterministic in both directions; verified in the browser test (§9).

## 8. Accessibility

- Semantic structure: `<main>` landmark, single `<h1>`, descriptive paragraph, real `<button type="button">`.
- The action has a visible text label ("Coba lagi"); the `WifiOff` icon is decorative (`aria-hidden="true"`), so there is no unlabeled icon-only action.
- Keyboard: the button is natively focusable (`tabIndex` 0, enabled) and uses the design system's `focus-visible` ring; no focus trap.
- Contrast comes from the existing theme tokens (`text-foreground` on `bg-card`, `text-muted-foreground` for the description) in both light and dark themes.
- No third-party accessibility dependency was added.

## 9. Browser-level offline test procedure

Environment: headless Chromium `Chrome/154.0.8037.0` (Playwright build 1244) driven over CDP, fresh `--user-data-dir`, production server (`bun run start`) on port 3000.

**Deterministic offline method.** The test disables the network for real by **killing the `next-server` process** (`ERR_CONNECTION_REFUSED`, no listener on :3000) and additionally sets `Network.setCacheDisabled(true)` on the CDP page target so the browser HTTP cache can never satisfy a document. CDP `Network.emulateNetworkConditions({offline:true})` was also tried, but in headless Chromium it made navigation commit nondeterministic (the request can be cancelled pre-commit); the server-shutdown method is the stronger and reproducible form of "network unavailable", so it is the one used.

**Ensuring the fallback was genuinely exercised.** A route that was never opened in the session (`/faq`) was chosen. Before going offline the test asserted that:
1. no navigation entry in the Performance API pointed at `/faq`;
2. no Cache Storage cache contained a `/faq` document;
3. the HTTP cache was disabled at the browser level;
4. the design-system page chunk for `/~offline` and the `/~offline` HTML entry were both present in the SW precache, while the `/~offline` HTML is served only from that precache (no network exists at failure time).

Test sequence (all assertions were executed against the live page):

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Load `/`, allow SW registration; wait active + activated, scope `/`, controlling the page | SW controls page | ✅ (control established via `clientsClaim`; test waited for it) |
| 2 | Navigate `/` → `/education` → `/classify` → `/` online | Normal pages | ✅ all markers found |
| 3 | Kill server, `Page.navigate` to never-visited `/faq` | "Kamu sedang offline" at `/faq` | ✅ text + description + URL preserved, SW-controlled |
| 4 | Click "Coba lagi" while still offline | Reload through SW, fallback remains usable | ✅ `performance.timeOrigin` changed (real reload) and the fallback re-rendered; no crash/hang |
| 5 | Offline API probes: `/api/classification/history`, `/api/waste-banks?limit=1`, `/api/inngest`, `/api/education/public?…publishedOnly=true` | Network errors, never offline HTML | ✅ all rejected (`TypeError: Failed to fetch`), `offlineHtml: false` for each |
| 6 | Offline `/dashboard` navigation | No offline HTML (stays NetworkOnly) | ✅ browser error page (`ERR_FAILED`), no fallback |
| 7 | Re-enter `/faq` offline after the error page | Fallback again (in-scope navigation interception) | ✅ |
| 8 | Restart server, click "Coba lagi" | Original `/faq` page loads | ✅ "Pertanyaan Umum" rendered at `/faq` |

**Result: 31/31 assertions passed.** Captured console output contained zero exceptions and only one warning (Clerk development-keys notice, unrelated to the fallback).

## 10. Static validation and generated service worker

| Check | Result |
|---|---|
| `bun run lint` | ✅ 0 errors, 21 pre-existing warnings (`src/hooks/*`, untouched) |
| `bunx tsc --noEmit` | ✅ no errors |
| `bun run build` (`next build --webpack`) | ✅ 29/29 static pages, `○ /~offline` in the route table; PWA log confirms the `/~offline` document fallback |
| `bun audit` | 121 pre-existing transitive/dev advisories (2 critical, 71 high, 44 moderate, 4 low) — unchanged from Phase 5, not remediated (out of scope) |
| Versions | Next 16.3.8 · React/React-DOM 19.2.8 · Clerk 7.9.11 · @ducanh2912/next-pwa 10.2.9 · Inngest 3.54.2 — **no dependency changes** |

Generated `public/sw.js` inspection (15 runtime routes):

```
 1. /                              → NetworkFirst (start-url)
 2-5. any URL POST/PUT/PATCH/DELETE → NetworkOnly        (mutation guards)
 6. /model/**                      → CacheFirst (daurtica-model)
 7. res.cloudinary.com             → SWR (daurtica-cloudinary)
 8. /_next/image                   → SWR (daurtica-next-image)
 9. /api/education/public?publishedOnly=true → NetworkFirst (daurtica-education-public)
10. /api/waste-banks*              → NetworkFirst (daurtica-waste-banks)
11. /dashboard/**                  → NetworkOnly
12. /api/inngest/**                → NetworkOnly
13. /api/**                        → NetworkOnly
14. same-origin document navigation→ NetworkOnly + handlerDidError → /~offline   [NEW, Phase 6]
15. any cross-origin               → NetworkOnly
```

- Routes 1–13 and 15 are the Phase 5 routes (same order, patterns, caches, strategies). The only functional change is the plugin's injected `handlerDidError` on the options-bearing entries (1, 6–10, 14); for non-document destinations it returns `Response.error()`, so caching semantics are unchanged.
- Precache manifest: **131 entries** (was 128), including `/~offline` and its page chunk; all 5 `/model/**` files remain.
- No `/api/**` or `/dashboard/**` response appears in the precache; mutation guards and private rules are intact.
- `skipWaiting()`, `clientsClaim()`, `cleanupOutdatedCaches()` remain.

## 11. Limitations

1. **Previously visited public documents are not cached.** This phase adds no document runtime cache, so offline navigations to any public route (visited or not) show the fallback rather than a cached copy. Site-wide document caching remains deferred.
2. **Dashboard/private navigations keep the browser error page offline** (no fallback) — the deliberate reading of the "dashboard remains NetworkOnly" constraint.
3. **The offline page renders inside the root layout.** Clerk's external `clerk.browser.js` cannot load offline; this does not affect rendering or the retry action (verified), but the failing request appears in the console. The page itself uses none of those providers.
4. **`/` may show the cached landing page** instead of the fallback when the `start-url` cache has an entry (plugin behavior, unchanged).
5. **`/~offline` has no `robots: noindex`** (a client component cannot export `metadata`; adding it would require restructuring). Low impact; noted for future hygiene.
6. **Non-preloaded `.woff2` fonts** rely on the browser HTTP cache (the plugin's default exclude pattern keeps only `.p.woff2` in precache); offline text gracefully falls back to system fonts (`font-display: swap`).
7. **CDP `offline:true` emulation is unreliable for navigation commit in headless Chromium** (observed pre-commit cancellation); future offline tests should use real server shutdown (or DevTools "Offline" manually) with the HTTP cache disabled.
8. **Legacy runtime caches are still not actively deleted** (unchanged from Phase 5; new cache names are used).

## 12. Deferred features (later phases)

- Install prompt (`beforeinstallprompt`, iOS handling, dismissal memory).
- Service-worker update lifecycle (`controllerchange` notice, `registration.update()` on visibility change, update toast).
- XSS remediation in the education renderer.
- Performance/Lighthouse optimization.
- Final QA/documentation pass.
- Optional future work: bounded runtime caching of public documents (and RSC payloads) for offline *content* in addition to the fallback; `noindex` for `/~offline`; precache hygiene (unused boilerplate SVGs).

## 13. Cycle summary

```
Offline document request
   → SW route 14 (NetworkOnly, document only)
   → network fails
   → plugin handlerDidError → self.fallback
   → caches.match("/~offline")   [precached at install]
   → offline page at the requested URL
   → "Coba lagi" reloads the document
   → online: real page | offline: fallback again
```

API requests, private data, dashboard, and authentication never enter this path.
