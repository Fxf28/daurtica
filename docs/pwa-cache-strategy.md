# Daurtica — PWA Service Worker & Controlled Cache Strategy (Phase 5)

> **Type:** Phase 5 record — service-worker architecture and controlled runtime caching
> **Date:** 2026-10-06
> **Branch:** `chore/modernize-pwa` (no commits made — reserved for the later commit phase)
> **Scope:** PWA configuration + runtime cache policy only. No offline UI, install prompt, SW update UX, XSS fix, or performance work.
> **Related docs:** `docs/modernization-audit.md` (§4, §5, §13), `docs/modernization-manifest.md`

---

## 1. Current PWA architecture

| Piece | State |
|---|---|
| Framework | Next.js **16.3.8** App Router, production build `next build --webpack` |
| PWA plugin | `@ducanh2912/next-pwa@10.2.9` (bundles Workbox **7.1.1** via `workbox-build`) |
| SW output | `public/sw.js` + `public/workbox-<hash>.js`, generated at build time, gitignored |
| Registration | plugin-managed (`register: true`); compiled client bundle contains `new Workbox(origin + "/sw.js", { scope: "/" })` |
| Scope | `/` |
| Lifecycle | `skipWaiting: true`, `clientsClaim: true`, `cleanupOutdatedCaches()` (unchanged from before this phase) |
| Start URL | `dynamicStartUrl: true` → plugin registers one automatic `NetworkFirst` runtime route for **exactly `/`** (`start-url` cache). `/` is a public, prerendered landing page. |
| Precache | Build-time manifest (128 entries): all `/_next/static/**`, public files, icons, and `public/model/**` (5 files ≈ 8.4 MB). Unchanged by this phase. |
| Manifest | `src/app/manifest.ts` → `/manifest.webmanifest` (Step 4). Not precached; fetched normally online. |

**Key mechanism:** because `workboxOptions.runtimeCaching` is supplied and `extendDefaultRuntimeCaching` is left at its default (`false`), the custom array **replaces** the plugin's default runtime routes (`resolveRuntimeCaching` in the installed package). This removes the plugin default `apis` `NetworkFirst` rule (which would have cached arbitrary `GET /api/**`) and the `pages`/`cross-origin` defaults. Only the routes listed in §3 exist, plus the automatic start-URL route.

Workbox routing is **first-match-wins**; a route's method defaults to `GET` (`workbox-routing` `defaultMethod = 'GET'`), and the generated SW passes the method explicitly (`"GET"`, `"POST"`, …).

## 2. Why `@ducanh2912/next-pwa` remains in use

- It is already integrated and stable through `next build --webpack`; Workbox 7 is bundled — no Workbox CLI and no second PWA library were added (hard constraints 1–3, 12–14).
- Its configuration surface (`workboxOptions.runtimeCaching`, `workbox-build` `RuntimeCaching`) exposes everything this policy needs: ordered URL matchers, method selection, strategies, named caches, `ExpirationPlugin`, and `CacheableResponsePlugin`.
- The plugin owns SW generation and registration, so `public/sw.js` stays a generated artifact and is never hand-maintained.

## 3. Runtime cache strategy

All rules live in `next.config.ts` (`withPWAInit → workboxOptions.runtimeCaching`). Every caching rule is **GET-only** (Workbox default method). All caching rules use bounded `ExpirationPlugin` limits and `purgeOnQuotaError: true`.

### 3.1 Cache table

| Resource | Match | Method | Strategy | Cache | Reason |
|---|---|---|---|---|---|
| `/model/**` | `url.pathname.startsWith("/model/")` | GET | CacheFirst | `daurtica-model` | ML model assets; static and expensive to re-download |
| Cloudinary | `url.protocol === "https:" && url.hostname === "res.cloudinary.com"` (exact host) | GET | StaleWhileRevalidate | `daurtica-cloudinary` | CDN images; exact host used by the app |
| Next Image optimizer | `sameOrigin && url.pathname === "/_next/image"` | GET | StaleWhileRevalidate | `daurtica-next-image` | Optimized image responses |
| Public education API | `sameOrigin && url.pathname === "/api/education/public" && url.searchParams.get("publishedOnly") === "true"` | GET | NetworkFirst (5 s timeout) | `daurtica-education-public` | Public published-only articles; offline fallback |
| Waste banks API | `sameOrigin && url.pathname.startsWith("/api/waste-banks")` | GET | NetworkFirst (5 s timeout) | `daurtica-waste-banks` | Public read-only local data |
| Dashboard | `sameOrigin && (pathname === "/dashboard" \|\| startsWith("/dashboard/"))` | GET | NetworkOnly | — | Private user HTML/data |
| Inngest | `sameOrigin && pathname.startsWith("/api/inngest")` | GET | NetworkOnly | — | Event infrastructure |
| API catch-all | `sameOrigin && pathname.startsWith("/api/")` | GET | NetworkOnly | — | Safety net for every non-approved API |
| Cross-origin catch-all | `!sameOrigin` | GET | NetworkOnly | — | Clerk/FAPI, auth/session, third-party — nothing cross-origin except Cloudinary |
| Mutations | `() => true` | POST / PUT / PATCH / DELETE | NetworkOnly | — | Structural guarantee: mutations can never reach a cache |
| Start URL (framework auto) | exact `/` | GET | NetworkFirst | `start-url` | Plugin `dynamicStartUrl`; public landing page only |

### 3.2 Match ordering (as generated in `public/sw.js`)

```text
1.  "/"                          -> NetworkFirst  (start-url)        [framework auto]
2.  any URL, POST                -> NetworkOnly
3.  any URL, PUT                 -> NetworkOnly
4.  any URL, PATCH               -> NetworkOnly
5.  any URL, DELETE              -> NetworkOnly
6.  /model/**                    -> CacheFirst    (daurtica-model)
7.  https://res.cloudinary.com   -> SWR           (daurtica-cloudinary)
8.  /_next/image                 -> SWR           (daurtica-next-image)
9.  /api/education/public?publishedOnly=true -> NetworkFirst (daurtica-education-public)
10. /api/waste-banks*            -> NetworkFirst  (daurtica-waste-banks)
11. /dashboard/**                -> NetworkOnly
12. /api/inngest/**              -> NetworkOnly
13. /api/**                      -> NetworkOnly
14. any cross-origin             -> NetworkOnly
```

The specific public rules (7–10) always precede the broad `NetworkOnly` rules, so no broad rule can override an approved public rule. The mutation guards are first, so even a future route registered for a mutation method could not reach a caching strategy.

### 3.3 Cache naming

Explicit `daurtica-*` names: `daurtica-model`, `daurtica-cloudinary`, `daurtica-next-image`, `daurtica-education-public`, `daurtica-waste-banks`. This replaced the previous generic names (`ai-model-cache`, `education-api-cache`, `images-cache`) and keeps caches separated by resource type (no fragmentation, no shared catch-all cache).

## 4. Security / privacy considerations

- **Mutations are structurally network-only.** Four first-position routes match every `POST`/`PUT`/`PATCH`/`DELETE` on any origin with `NetworkOnly`. In addition, every caching rule is registered for `GET` only, so mutations never match a caching strategy even without the guards. Covers AI classification POSTs, history creation, education generation/publish, admin operations, Inngest sync, and auth requests.
- **No generic API cache.** `GET /api/**` hits `NetworkOnly` unless it matched an explicitly approved public rule first. This includes `/api/classification/*`, `/api/classification/history*`, `/api/education/personal*`, `/api/education/public` (without the flag), `/api/education/public/[id]`, `/api/education/public/slug/*`, `/api/education/personal/usage`, and any future route.
- **`publishedOnly=true` is mandatory.** `GET /api/education/public` is session-variant: authenticated requests without the flag may return drafts (`src/app/api/education/public/route.ts`, `if (publishedOnly || !userId)`). The matcher requires the exact pathname **and** `publishedOnly=true`; nothing else about this endpoint is cached.
- **Dashboard never cached.** `/dashboard` and all subpaths are `NetworkOnly`, so private HTML/data cannot enter Cache Storage.
- **Clerk/auth/session never cached.** Rather than hardcoding an environment-dependent Clerk host (the dev instance is `*.clerk.accounts.dev`, production may differ), the final catch-all sends **every cross-origin request** to `NetworkOnly`. Cloudinary (exact host) is matched earlier, so it is unaffected. Same-origin auth/session endpoints fall under `/api/**` → `NetworkOnly`.
- **Cacheable response filtering.** Same-origin caches accept only `status 200` (`cacheableResponse: { statuses: [200] }`); the Cloudinary cache accepts `[0, 200]` because cross-origin `<img>` responses are opaque (`status 0`). Redirects, errors, and non-200 responses are never cached.
- **Bounded caches.** Every caching rule has `maxEntries` + `maxAgeSeconds` + `purgeOnQuotaError: true` (§5).
- **No `Set-Cookie` response can be cached**, because no rule capable of caching ever matches the authenticated/private endpoints that set cookies; the only cached HTML is the public landing page `/`.

## 5. Cache expiration decisions

| Cache | maxEntries | maxAgeSeconds | Rationale |
|---|---|---|---|
| `daurtica-model` | 10 | 31 536 000 (365 d) | 5 model files + headroom for future model versions; bounded against accidental accumulation |
| `daurtica-cloudinary` | 64 | 2 592 000 (30 d) | Mirrors Workbox's canonical static-image bound (64 entries / 30 d); Cloudinary URLs are content-addressable and effectively immutable |
| `daurtica-next-image` | 64 | 2 592 000 (30 d) | Same canonical image bound; optimizer variants are keyed by full URL |
| `daurtica-education-public` | 32 | 86 400 (1 d) | Public articles change at human pace; one day of offline fallback is conservative |
| `daurtica-waste-banks` | 32 | 86 400 (1 d) | Public directory data changes rarely; one day balances freshness and offline resilience |
| `start-url` | unbounded count (no `ExpirationPlugin`; plugin default) | no max age (plugin default) | Framework-managed; caches only the public landing page HTML (`/`), so growth is bounded in practice |

Note (Phase 11 QA correction): `@ducanh2912/next-pwa` `dynamicStartUrl` registers the `start-url` route with only `cacheWillUpdate` (verified in `node_modules/@ducanh2912/next-pwa/dist/index.js` and the generated `public/sw.js`) — there is no `ExpirationPlugin`, so no 32-entry/1-day bound applies. Only the `/` landing HTML enters this cache.

`networkTimeoutSeconds: 5` is used for both `NetworkFirst` rules: fresh server data is preferred, and the cache is only used after a conservative timeout or network failure.

Note: `ExpirationPlugin` bounds by entry **count**, not bytes; `purgeOnQuotaError: true` additionally allows Workbox to purge these caches if the browser storage quota is exceeded.

## 6. What is intentionally NOT cached

- All `POST` / `PUT` / `PATCH` / `DELETE` requests, on any origin.
- All `/api/**` responses except the two explicitly approved public GET endpoints.
- `/api/classification/*` (history, tips/AI) — private and/or AI.
- `/api/education/personal*` (including usage) — private user data.
- `/api/education/public` without `publishedOnly=true`; `[id]`, `slug/[slug]`, and `publish` variants — session-variant or mutation.
- `/dashboard/**` — private user HTML/data.
- `/api/inngest/**` — event infrastructure.
- Clerk/FAPI and all cross-origin requests except `res.cloudinary.com` — auth/session/third-party.
- RSC navigation payloads and public documents other than `/` — deferred to the offline UX phase.
- `/_next/**` as a whole (only `/_next/image` is runtime-cached; other `/_next/static/**` files are handled by the build-time precache manifest, which is the framework's normal behavior).

## 7. Verification performed

Environment: Bun 1.4.0, production `.env` present, port 3000, headless Chromium (Playwright build 1244) driven over CDP.

### 7.1 Static checks

| Check | Result |
|---|---|
| `bun run lint` | PASS — 0 errors, 21 pre-existing warnings in `src/hooks/*` (untouched) |
| `bunx tsc --noEmit` | PASS — exit 0 |
| `bun run build` | PASS — `next build --webpack`, 28/28 static pages, PWA log: `Custom runtimeCaching array found, using it instead of the default one` |
| `bun audit` | 121 pre-existing transitive/dev advisories (2 critical, 71 high, 44 moderate, 4 low); no direct advisory on `next`, `@clerk/nextjs`, `@ducanh2912/next-pwa`, or `inngest` themselves. No remediation attempted (out of scope). |

### 7.2 Generated `public/sw.js` inspection

The generated SW (15 808 B + `workbox-b2e32392.js`) contains **15 runtime routes**: the 14 routes of §3.2 in order, plus the Phase 6 document-navigation `NetworkOnly` fallback route inserted before the cross-origin catch-all (see `docs/pwa-offline.md` §2). Patterns, cache names, strategies, methods, and `ExpirationPlugin`/`CacheableResponsePlugin` options match the policy (re-verified in Phase 11 with a route-by-route extraction of the generated `registerRoute(...)` calls). `precacheAndRoute` still contains the full 131-entry precache manifest including all model files. `skipWaiting()`, `clientsClaim()`, `cleanupOutdatedCaches()` remain.

### 7.3 Production smoke tests (`bun run start` + curl)

| URL | Result |
|---|---|
| `/` | 200 HTML |
| `/classify` | 200 HTML |
| `/education` | 200 HTML |
| `/map` | 200 HTML |
| `/faq` | 200 HTML |
| `/api/waste-banks?limit=1` | 200 JSON |
| `/api/education/public?page=1&limit=1&publishedOnly=true` | 200 JSON |
| `/api/classification/history` (private) | 401 JSON |
| `/api/education/personal/usage` (private) | 401 |
| `POST /api/education/public` (no auth) | 401 — no mutation |
| `POST /api/waste-banks` (no auth) | 401 — no mutation |
| `/dashboard` (browser-like `Accept` header) | 307 → Clerk sign-in (unchanged unauthenticated behavior) |
| `/manifest.webmanifest` | 200 `application/manifest+json` |
| `/sw.js` | 200 JS |

### 7.4 Browser-level Cache Storage inspection (CDP)

A headless Chromium session registered the SW (`activated`, `controlled: true`), reloaded through it, then exercised both approved and private endpoints. Observed caches:

| Cache | Contents |
|---|---|
| `start-url` | exactly `http://localhost:3000/` (1 entry) |
| `workbox-precache-v2-http://localhost:3000/` | 128 precache entries (build assets, public files, model files) |
| `daurtica-education-public` | exactly the `?page=1&limit=2&publishedOnly=true` request (1 entry) |
| `daurtica-waste-banks` | exactly `/api/waste-banks?limit=1` (1 entry — a repeated request did not duplicate the entry) |
| `daurtica-model` | exactly `/model/model.json?v=step5-runtime` (runtime rule works; plain URLs are served from precache) |
| `daurtica-next-image` | exactly `/_next/image?url=%2Flogo.png&w=96&q=75` |
| `daurtica-cloudinary` | exactly `https://res.cloudinary.com/demo/image/upload/w_100/sample.jpg` (opaque image cached) |

After fetching `/api/classification/history` (401), `/api/education/public?page=1&limit=2` (no flag), `/api/education/personal/usage` (401), `/api/inngest` (401), `POST /api/education/public` (401), `PUT`/`DELETE` history (405/401), and `/dashboard`:
**zero offending entries** — no `/api/classification`, `/api/inngest`, `/api/education/personal`, `/dashboard`, or Clerk URL appeared in any cache. All mutation requests remained uncached.

## 8. Known limitations

1. **Legacy runtime caches are not actively deleted.** Browsers that ran the previous SW may still hold `ai-model-cache`, `education-api-cache` (which could contain old un-narrowed education responses), and `images-cache`. The new SW never reads them (new names), and `cleanupOutdatedCaches()` only removes outdated *precache* caches. No custom cleanup code was added because that would mean a second SW implementation (constraint 12). They age out with browser storage eviction; a user-initiated “clear site data” removes them immediately.
2. **`/_next/image` caching can hold optimized bytes of images shown on the dashboard** (e.g., user waste photos on public-by-unlisted-URL Cloudinary assets). This is the explicitly approved rule; it is bounded (64 entries / 30 days) and contains no API/private JSON.
3. **`start-url` caches the public landing HTML** (`/`) NetworkFirst. This is the plugin's `dynamicStartUrl` behavior, not a policy rule; `/` is prerendered and contains no server-rendered user data.
4. **Model precache cost.** `public/model/**` (≈ 8.4 MB) is precached by the plugin's public-folder glob (existing behavior, kept for the offline-classification product capability). The `daurtica-model` runtime cache only covers URL variants not in the precache manifest.
5. **Precache hygiene debt unchanged:** unused boilerplate SVGs (`next.svg`, `vercel.svg`, `window.svg`, `file.svg`, `globe.svg`) are still precached (deferred Step 3 item 6).
6. **Immediate SW activation** (`skipWaiting` + `clientsClaim`) with no update UX remains as before; the update lifecycle is deferred.
7. **Offline deep links still fail** (no document fallback yet). No `/offline` route was invented in this phase, per the phase constraints.
8. Logged-in dashboard behavior could not be exercised end-to-end (no test credentials); its protection was verified by rule inspection (`NetworkOnly`) plus the unauthenticated redirect test.

## 9. Future work deferred to later phases

- **Offline page / fallback UX:** add `src/app/~offline/page.tsx` (the plugin auto-detects this `~offline` convention and wires the document fallback automatically; alternatively `fallbacks.document` can be set explicitly). No fallback is configured today.
- **Install prompt** (`beforeinstallprompt`, iOS handling, dismissal memory).
- **Service-worker update lifecycle** (`controllerchange` notice, `registration.update()` on visibility change).
- **XSS remediation** in the education renderer (Step 9 of the locked plan).
- **Performance optimization** (Step 10/11).
- Optional hygiene: exclude unused public boilerplate from precache; public-document NetworkFirst whitelist (offline phase); cache versioning strategy.

## 10. Constraints respected

- `@ducanh2912/next-pwa@10.2.9` kept; no Workbox CLI; no new PWA/SW library; no dependency changes at all.
- Next 16.3.8, React 19.2.8, Clerk 7.9.11, Inngest 3.54.2 unchanged.
- No database/schema/migration changes; no API contract changes; no Clerk auth behavior changes; no AI classification changes; Inngest route handlers untouched.
- `public/sw.js` and `public/workbox-*.js` remain generated + gitignored; no commits made.
