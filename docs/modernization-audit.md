# Daurtica — Modernization Audit

> **Type:** Read-only audit (Step 1 of the locked modernization plan)
> **Date:** 2026-10-06
> **Branch:** `chore/modernize-pwa` (created from `main` @ `0eeaca5`)
> **Scope:** Next.js 15 PWA modernization — audit only; no implementation changes in this step.
> **Legend:** **[Confirmed]** = directly verified in files/commands · **[Observation]** = inferred from inspected code (not runtime-tested) · **[Recommendation]** = proposed action for later steps · **[Unresolved]** = needs a decision or runtime verification.

---

## 1. Executive summary

Daurtica is already a modern Next.js 15.4.x / React 19 application with Clerk auth, TanStack Query v5, Drizzle/Neon, Cloudinary, Inngest, and client-side TensorFlow.js classification. It is **not** a legacy-framework migration project. The PWA layer already exists via `@ducanh2912/next-pwa` (manifest, icon set, generated Workbox service worker, four runtime cache routes).

The real modernization surface is:

1. **Lint passes; the config merely lacks ignore hardening** — `bun run lint` / `npm run lint` are green (`✔ No ESLint warnings or errors`; `src/` verified clean via `eslint src --max-warnings=0` → exit 0). However, `eslint.config.mjs` defines no global ignores, so repo-wide ESLint invocations (e.g. `eslint .`, some IDE integrations) would sweep generated artifacts (`.next/**`, `public/sw.js`, `public/workbox-*.js`) — `.next/server/chunks/7770.js` alone reports 1932 problems. *(An earlier audit-phase signal implying `next lint` was red was investigated and disproven — see `docs/modernization-baseline.md`.)* Adding ignores remains recommended hardening, not a red gate.
2. **Generated service-worker files are committed to git** (`public/sw.js`, `public/workbox-c18c662b.js`) and the working tree is dirty from a local build — repo hygiene + stale-SW risk.
3. **Offline coverage is thin** — only `/` (start-url) is handled; there is no offline fallback page; deep-link navigation fails offline.
4. **Cache rules are too coarse in one place** — `/api/education/public` is cached NetworkFirst **without narrowing**, while that endpoint's response varies by Clerk session.
5. **Loading infrastructure contains dead code** — `loading-overlay.tsx` + `use-global-loading.ts` are unused, and `use-navigation-loading` can get stuck on modified clicks (Ctrl/Cmd-click) or query-only navigations.
6. **Pre-existing security findings** (documentation-only in this modernization, except the approved XSS fix): education-article HTML renderer injects unescaped content; education public write APIs enforce *authorship* but not the *admin role* the UI implies; `/api/education/public/[id]` GET returns unpublished drafts without authentication; `/api/classification/tips` POST is unauthenticated.

**Step-2 baseline result (2026-10-06):** lint ✅ PASS · typecheck ✅ PASS · build ❌ as-is (missing env) / ✅ with placeholder env — full details, bundle table, and env requirements in `docs/modernization-baseline.md`.

No functional rewrite is required or planned. All changes stay incremental.

---

## 2. Repository / toolchain audit

### 2.1 Stack [Confirmed]

| Item | Value |
|---|---|
| Next.js | `15.4.8` (pinned exact) — `package.json`, `bun.lock` (post-change) |
| React / React-DOM | `19.1.0` |
| TypeScript | `^5`, `strict: true`, `noEmit: true`, path alias `@/* → ./src/*` |
| Tailwind | v4 via `@tailwindcss/postcss`; **no `tailwind.config.*`** — CSS-first config in `src/app/globals.css` (`@import "tailwindcss"` + `@theme inline` + oklch CSS vars) |
| ESLint | v9 flat config `eslint.config.mjs` via `FlatCompat` extending `next/core-web-vitals` + `next/typescript`; **no ignore list** (`next lint` targets `src` only and passes; latent issue: repo-wide ESLint runs sweep generated files) |
| Auth | `@clerk/nextjs ^6.32.2` (middleware-protected `/dashboard(.*)`) |
| Data fetching | `@tanstack/react-query ^5.90.10` (single provider in root layout; `staleTime: 60s`, `retry: 1`) |
| DB | Drizzle ORM `0.44.7` + `@neondatabase/serverless` (HTTP driver), schema `src/db/schema.ts`, migrations `drizzle/` |
| Media | `cloudinary ^2.8.0` (server-side uploads) + `next/image` `remotePatterns: res.cloudinary.com` |
| Jobs/AI | `inngest ^3.45.1`; `@google/generative-ai ^0.24.1` (server only) |
| ML | `@tensorflow/tfjs ^4.22.0` (browser, dynamically imported); model at `public/model/` (~7.8 MB in 3 shards) |
| PWA | `@ducanh2912/next-pwa ^10.2.9` (Workbox 7 under the hood) |
| UI | shadcn (`components.json`, new-york, RSC), Radix, `lucide-react`, `framer-motion ^12`, `sonner`, `next-themes`, `recharts`, `leaflet`/`react-leaflet`, `react-webcam` |

### 2.2 Scripts [Confirmed]

```json
"dev":   "next dev --turbopack",
"build": "next build",
"start": "next start",
"lint":  "next lint"
```

- **No `typecheck` script** → Step 3 adds `"typecheck": "tsc --noEmit"` (locked plan).
- `postinstall` absent; SW generation happens inside `next build` (webpack only; dev runs Turbopack with PWA disabled).

### 2.3 Package manager [Confirmed — decision: Bun canonical]

- Canonical: **Bun 1.4.0** (locked decision).
- Tracked lockfiles: `bun.lock` **and** `package-lock.json` (dual-lockfile smell; npm lock is stale at next 15.4.7).
- Environment: Bun `1.4.0`, Node `v26.7.0`, Linux (`7.1.9-arch1-2`).
- README still documents `npm install` / `npm run dev` → must be updated to Bun in Step 3.
- `.env` exists but is **0 bytes**; no `.env.local`; `.gitignore` covers `.env*`. ⇒ Production build locally may lack Clerk keys (see §11 risk R6).

### 2.4 Next.js configuration (`next.config.ts`) [Confirmed]

- Wrapped in `withPWAInit({...})`; PWA disabled when `NODE_ENV=development`.
- `headers()`: `/model/:all*` → `Cache-Control: public, max-age=31536000, immutable` (good; keep).
- `rewrites()`: `{ source: "/api/inngest", destination: "/api/inngest" }` — **no-op self-rewrite** (legacy noise; removable in cleanup with approval).
- `images`: Cloudinary remote pattern, `webp`/`avif`.
- `allowedDevOrigins`: localhost + auto-detected LAN IP (dev convenience).

### 2.5 Generated-file handling [Confirmed]

- next-pwa `dest: "public"` → `public/sw.js` + `public/workbox-<hash>.js` are **written at build time but tracked in git** (all three files listed by `git ls-files`).
- `.gitignore` does **not** list them (current state: every build dirties the tree).
- `next-env.d.ts` is gitignored (standard).

---

## 3. Current architecture

### 3.1 Routing [Confirmed]

```
src/app/
├── layout.tsx                  (server; ClerkProvider → QueryClientProvider → ThemeProvider → ProgressLoader + Toaster)
├── query-client-provider.tsx   (client; QueryClient singleton per mount)
├── globals.css                 (Tailwind v4 theme)
├── sitemap.ts                  (metadata route)
├── (public)/                   about · classify · education · education/[slug] · faq · map · page (home) · privacy · sitemap-ui · terms
├── api/
│   ├── classification/         history · history/[id] · tips
│   ├── education/              personal · personal/[id] · personal/[id]/generate · personal/usage
│   │                           public · public/[id] · public/[id]/publish · public/slug/[slug]
│   ├── inngest/route.ts
│   └── waste-banks/            route · [id] · near
├── dashboard/                  page · camera · education · generate · history · upload · waste-banks
└── middleware.ts               (Clerk; protects /dashboard(.*))
```

- `dashboard/layout.tsx` is a **client** layout wrapping pages in `AuthGuard`; `/dashboard/education` additionally uses client-side `AdminGuard`.
- `(public)/*` pages: home/about/faq/privacy/terms are server-capable, but `about`, `faq`, `privacy`, `sitemap-ui`, `terms`, `classify`, `education`, `map` all carry `"use client"` at page level (21/117 `src` files are client, incl. UI primitives — normal for shadcn).

### 3.2 Auth boundaries [Confirmed]

- `middleware.ts`: `clerkMiddleware` + `createRouteMatcher(["/dashboard(.*)"])` → `auth.protect()`. Matcher also runs Clerk middleware over `/api(.*)`; individual route handlers perform their own checks.
- API authorization summary (see §6 for full matrix):
  - **Clerk-protected, user-scoped:** classification history (all), education personal (all).
  - **Admin (`publicMetadata.role === 'admin'`):** waste-banks POST/PUT/DELETE.
  - **Author-scoped (`authorId === userId`):** education public PUT/DELETE/publish.
  - **Login only (no role/ownership):** education public POST.
  - **No auth:** education public GET (list), education public `[id]` GET, education public slug GET (published-only when anonymous), waste-banks GETs, classification tips POST, inngest routes.

### 3.3 Data fetching [Confirmed]

- React Query v5 consumers [Confirmed]: `src/hooks/use-classification-history.ts` (history queries/mutations), `src/hooks/use-quick-tips.ts` (tips mutation), `src/components/dashboard/history-item.tsx` (delete mutation), plus the root provider. Public pages use hand-rolled `fetch` + `useState` (education list; map via `useWasteBanks` with AbortController and a 5 s in-memory `requestCache`).
- `education/[slug]` is a **server component** that fetches its own `/api/education/public/slug/*` with `cache: "no-store"` via `getBaseUrl()`.
- Loading UI is mostly **local**: skeletons (`map-skeleton`, `dashboard-skeleton`), inline spinners, upload progress; a global navigation progress bar exists (§8).

### 3.4 AI classification flow [Confirmed]

- 100 % client-side inference: `use-classification` → `classifier-browser` → dynamic `import("@tensorflow/tfjs")` → WebGL backend → `loadGraphModel("/model/model.json")` (singleton with in-flight promise). Labels: 14 classes (Organik/Anorganik/B3 mapping).
- `use-model-status` reports `loading|ready|error`; upload/camera UI gates on `ready`.
- On model failure the hook falls back to **mock predictions** (product choice; noted, not changed).
- Model assets are served from `/model/` (immutable headers) and are mandatory for offline classification.
- Gemini is server-only: `/api/classification/tips` (quick tips), `/api/education/personal/[id]/generate` (education content, usage-limited via `user_generate_usage`), Inngest background generation.

### 3.5 Images [Confirmed]

- `next/image` used for Cloudinary thumbnails (education list/detail) and local previews (`logo.png`, `hero-recycle.svg` via plain `<img>`/Next where appropriate).
- `next.config.ts` restricts remote images to `res.cloudinary.com`; formats webp/avif.

### 3.6 Education rendering [Confirmed]

- `src/app/(public)/education/[slug]/page.tsx` implements a **custom markdown-lite parser** (`parseContent`) and renders paragraphs/lists/blockquotes via `dangerouslySetInnerHTML` after `renderInlineFormatting()` — which does **not escape HTML**. `react-markdown` + `rehype-raw` + `remark-gfm` are declared but **not imported anywhere in `src/`**.
- `src/app/dashboard/education/page.tsx` is wrapped in client-side `AdminGuard`; API does not enforce the admin role (see §7).

---

## 4. Current PWA implementation

### 4.1 What exists [Confirmed]

| Piece | State | Detail |
|---|---|---|
| PWA plugin | ✅ `@ducanh2912/next-pwa@10.2.9` | `next.config.ts`, `dest: "public"`, `register: true`, `disable` in dev |
| Service worker | ✅ generated | `public/sw.js` (12.9 KB) + `public/workbox-c18c662b.js` (21.7 KB); committed to git |
| Registration | ✅ plugin-managed | Auto-registration enabled (`register: true`); docs/types confirm plugin injects registration. *Exact injected snippet not traced — verify at runtime in a later phase.* |
| Workbox options | ⚠️ present | `skipWaiting: true`, `clientsClaim: true`, 3 custom runtime routes |
| Manifest | ✅ `public/manifest.json` | Full branding: name/short_name/description/start_url `/`, `display: standalone`, `orientation: portrait`, `background_color #ffffff`, `theme_color #16a34a`, `id`/`scope` `/`, `lang: id`, categories, icons 192/512 `purpose: "any maskable"` |
| Manifest duplicate | ⚠️ `public/site.webmanifest` | Stale favicon-generator file: **empty name/short_name**, theme `#ffffff`; precached but referenced nowhere in `src/` |
| Manifest reference | ✅ metadata | `src/app/layout.tsx` → `manifest: '/manifest.json'` |
| Icons | ✅ complete | `android-chrome-192/512` (both `any maskable`, artwork has safe margins), `apple-touch-icon 180`, `favicon-16/32`, `favicon.ico`, `my-favicon.ico` |
| Apple meta | ✅ | `appleWebApp: { capable, statusBarStyle: default, title: Daurtica }`; `viewport.themeColor` light/dark entries |
| Offline fallback | ❌ none | No `/offline` route, no `fallbacks` config |
| Install prompt | ❌ none | No `beforeinstallprompt` handling anywhere in `src/` |
| Update UX | ❌ none | No `controllerchange`/update notification; `skipWaiting` + `clientsClaim` activate new SW immediately |
| `src/app/manifest.*` | ❌ absent | Manifest lives only in `public/` |

### 4.2 Generated SW behavior [Confirmed — from generated artifact]

Precache (build-time manifest): all `/_next/static/**` (chunks, CSS, fonts, Leaflet marker icons), `/model/*` (7.8 MB), both manifests, icons, favicons, `robots.txt`, and **Next boilerplate SVGs** (`next.svg`, `vercel.svg`, `window.svg`, `file.svg`, `globe.svg`).

Runtime routes (GET only):

1. `/` → `NetworkFirst` (`start-url`).
2. `/model/` → `CacheFirst` (`ai-model-cache`, 20 entries / 365 d). *(Note: model files are also precached.)*
3. `/api/education/public` → `NetworkFirst` (`education-api-cache`, 5 s timeout, 50 entries / 1 d). **Un-narrowed** — see §6.
4. Cloudinary (`url.hostname.includes("cloudinary")`, loose) **or** `/_next/image` → `StaleWhileRevalidate` (`images-cache`, 50 entries / 7 d).

Also present in generated SW: `cleanupOutdatedCaches()`, `ignoreURLParametersMatching: [/^utm_/, /^fbclid$/]`.

**No route handles navigations other than exactly `/`.** No documents/dynamic pages are precached or runtime-cached ⇒ offline deep links (e.g. `/classify`, `/education`, `/map`) fail. **[Confirmed]**

### 4.3 Not cached today (good baseline) [Confirmed]

- All POST/PUT/PATCH/DELETE (Workbox routes registered for `GET` only).
- `/api/classification/*` (no rule matches).
- `/api/inngest` (no rule matches).
- `/api/waste-banks*` (no rule matches — currently online-only).
- Clerk responses/cookies (no rule/scope match).
- RSC navigation payloads (`cacheOnFrontEndNav` is off by default — verified option exists and is unused).

---

## 5. Service-worker / cache audit (current vs target)

| Resource | Current | Locked-plan target | Rationale |
|---|---|---|---|
| `/_next/static/**` | Precache (Cache First) | Keep | Immutable, hashed |
| `/model/**` | Precache + CacheFirst | Keep (offline AI requirement) | ~7.8 MB; needed for offline classify |
| Public icons/fonts | Precache | Keep (minus unused boilerplate) | |
| Cloudinary + `/_next/image` | SWR (hostname `includes("cloudinary")`) | SWR with **exact host** `res.cloudinary.com` + `/_next/image` | Prevent over-broad host matching |
| `/api/waste-banks`, `/api/waste-banks/[id]`, `/api/waste-banks/near` | Not cached | NetworkFirst (public read-only, GET only) | Static-ish public data; improves offline map |
| `/api/education/public?publishedOnly=true` | Cached (un-narrowed) | NetworkFirst **narrowed** to `publishedOnly=true` | Avoid caching auth-variant responses |
| `/api/education/public` (other params), slug, `[id]` GET | Partially cached | **Network Only** | Auth/session-variant; drafts exposure |
| `/api/classification/history*` | Not cached | Network Only (explicit) | Private user data |
| `/api/education/personal*` | Not cached | Network Only (explicit) | Private user data |
| `/api/classification/tips`, generate | Not cached | Network Only (explicit) | AI POST; cost/consistency |
| `/api/inngest` | Not cached | Network Only (explicit) | Webhook endpoints |
| `/api/**` catch-all | N/A | Explicit `NetworkOnly` catch-all | Safety net for future routes |
| Documents | Only `/` start-url | NetworkFirst whitelist of public routes + `/offline` fallback; **exclude `/dashboard`**; skip responses with `Set-Cookie` | Offline UX without private-data caching |
| Clerk / any auth response | N/A | Never cache (documented rule) | Security |

---

## 6. API / cache-security audit

Full endpoint matrix (source-verified; "cache class" is a **conceptual recommendation**, not implemented):

| Endpoint | Methods | Authorization [Confirmed] | Sensitive? | Conceptual class |
|---|---|---|---|---|
| `/api/waste-banks` | GET | Public (active only) | No | PUBLIC_DYNAMIC → NetworkFirst |
| `/api/waste-banks` | POST | Auth + **admin** | No | AUTHENTICATED_WRITE → NetworkOnly |
| `/api/waste-banks/[id]` | GET | Public (active only) | No | PUBLIC_DYNAMIC → NetworkFirst |
| `/api/waste-banks/[id]` | PUT/DELETE | Auth + **admin** (soft delete) | No | AUTHENTICATED_WRITE → NetworkOnly |
| `/api/waste-banks/near` | GET | Public (lat/lng via query) | No | PUBLIC_DYNAMIC → NetworkFirst (URL-keyed) |
| `/api/classification/history` | GET/POST | Auth, user-scoped | **Yes** | AUTHENTICATED_READ/WRITE → NetworkOnly |
| `/api/classification/history/[id]` | GET/DELETE | Auth, user-scoped | **Yes** | AUTHENTICATED_READ/WRITE → NetworkOnly |
| `/api/classification/tips` | POST | **None** | AI cost vector | AI_PROCESSING → NetworkOnly |
| `/api/education/public` | GET | Login-optional; anon ⇒ published-only; session changes filtering | Session-variant | Narrow to `publishedOnly=true` → NetworkFirst; else NetworkOnly |
| `/api/education/public` | POST | Auth only (no role/ownership check) | Creates public content | AUTHENTICATED_WRITE → NetworkOnly |
| `/api/education/public/[id]` | GET | **None — returns drafts too** | **Data exposure** | NetworkOnly (finding §7.3) |
| `/api/education/public/[id]` | PUT/DELETE | Auth + author | | AUTHENTICATED_WRITE → NetworkOnly |
| `/api/education/public/[id]/publish` | PATCH | Auth + author | | AUTHENTICATED_WRITE → NetworkOnly |
| `/api/education/public/slug/[slug]` | GET | Anon ⇒ published-only; authenticated ⇒ drafts visible | Session-variant | NetworkOnly |
| `/api/education/personal*` (4 routes) | GET/POST/PATCH/DELETE | Auth, user-scoped; usage-limited | **Yes** | AUTHENTICATED_READ/WRITE → NetworkOnly |
| `/api/inngest` | GET/POST/PUT | Inngest-signed public endpoint | Control plane | NEVER CACHE |
| `/model/*` | GET | Public static | No | PUBLIC_STATIC → CacheFirst/precache |
| Cloudinary images | GET | Public URLs (unguessable names) | Low (user photos in dashboard) | PUBLIC_IMAGE → SWR (exact host) |
| Clerk (`/__clerk/*`, auth cookies) | any | Auth | **Yes** | NEVER CACHE |

**Must never be cached (rules to document + enforce):** Clerk responses/cookies, any `Set-Cookie` response, dashboard documents, RSC payloads (keep `cacheOnFrontEndNav` off), classification history + education personal data, all API writes, AI POSTs, `/api/inngest`.

---

## 7. Education admin-mismatch finding (documentation-only)

### 7.1 Affected files

- `src/app/dashboard/education/page.tsx` (UI gated by client-side `AdminGuard`)
- `src/components/admin-guard.tsx` (client-side role check only)
- `src/app/api/education/public/route.ts` (GET list / POST create)
- `src/app/api/education/public/[id]/route.ts` (GET / PUT / DELETE)
- `src/app/api/education/public/[id]/publish/route.ts` (PATCH)
- `src/app/api/education/public/slug/[slug]/route.ts` (GET)
- Contrast: `src/app/api/waste-banks/route.ts` + `[id]/route.ts` do enforce `publicMetadata.role === "admin"` server-side.

### 7.2 Current behavior [Confirmed]

- **UI:** `/dashboard/education` is admin-only (client `AdminGuard`); route itself only requires login (middleware) + `AuthGuard`.
- **API:** any authenticated user can create (`POST`), and can edit/delete/publish articles **they authored**. No endpoint checks the admin role.
- This is an **intentional-looking authorship model** ("any logged-in user may submit; authors manage their own articles") that contradicts the admin-only UI. *Intent is undocumented.*

### 7.3 Additional discovery — unauthenticated draft read [Confirmed]

`GET /api/education/public/[id]` performs **no `auth()` call** and returns the article regardless of `isPublished`. The slug route (`/slug/[slug]`) correctly hides drafts from anonymous users; the `[id]` route does not. Also found while auditing (related, same domain):

- `POST /api/education/public` has no role check (same as §7.2).
- `POST /api/classification/tips` has no auth and no visible rate limit while calling Gemini.

### 7.4 Security / data implications

- Client-side-only admin gating is bypassable by calling APIs directly (any logged-in account becomes an "author" of public content).
- Draft (unpublished) article bodies/thumbnails are readable by anyone who knows/guesses a UUID.
- Unauthenticated Gemini endpoint could be abused for cost/DoS. *(Pre-existing; out of PWA scope.)*

### 7.5 Recommendation

**Handle separately from this modernization** (locked decision). Record in docs; do not change API behavior in Steps 3–11. A follow-up security task should decide between: (a) admin-only writes to match UI, or (b) documented author model + server-enforced per-author scoping plus a fix for the `[id]` draft exposure and tips authentication.

---

## 8. Loading architecture audit

### 8.1 Inventory [Confirmed]

| Item | Status | Notes |
|---|---|---|
| `src/components/progress-loader.tsx` | **Active** (mounted in root layout) | Navigation loading only; fixed top progress bar + "Memuat halaman…" banner; simulated progress; hides 500 ms after pathname change |
| `src/components/loading-overlay.tsx` | **Dead** | Full-screen blocking overlay driven by `useGlobalLoading`; never imported anywhere |
| `src/hooks/use-global-loading.ts` | **Dead** (only imported by the dead overlay) | Combines navigation loading OR `useIsFetching() > 0` → would block UI on any background fetch |
| `src/hooks/use-navigation-loading.ts` | **Active** | Document click interception; `setIsLoading(false)` on pathname change |
| `src/components/loading-spinner.tsx` | Active | Used widely (inline/skeletons) |
| TanStack integration | Provider only | `useIsFetching` appears **only** in the dead hook; `useIsMutating` unused; no `isValidating`/SWR remnants (only a comment "Hapus SWR untuk sementara…") |
| Skeletons/local loading | Active | `map-skeleton`, `dashboard-skeleton`, upload/camera progress, inline spinners — good pattern |

### 8.2 Stuck-loading risk analysis of `use-navigation-loading` [Observation]

- Trigger: any click on an internal `<a href="/...">`; no check for `event.button`, `metaKey`/`ctrlKey`/`shiftKey` ⇒ **Ctrl/Cmd/middle-clicks set loading but never navigate** the current page → bar stays until next same-window navigation.
- Query-only navigations (`/education?x=1` while already on `/education`) compare `href !== pathname` (raw href vs pathname) ⇒ false positive; if the router doesn't change `pathname`, loading never resets.
- `beforeunload` sets loading true (moot; page unloads).
- No safety timeout.
- Conclusion: **confirmed potential stuck state**, bounded in severity (cosmetic progress bar only; it is not a blocking overlay).

### 8.3 Global-overlay assessment [Confirmed]

The only global indicator is navigation-based; no request-driven blocking exists today (the risky `useGlobalLoading` is dead). `useIsFetching()/useIsMutating()` are **not** needed for global UX per locked plan (separate navigation vs data vs mutation vs AI loading; prefer local/skeleton).

---

## 9. Performance observations (hypotheses only — no changes made)

1. **Framer Motion:** the app uses lean `LazyMotion` + `m` (`framer-wrapper.tsx`) on classify/education/map pages, but `navbar.tsx` imports full `motion`/`AnimatePresence` directly. Navbar is mounted on every public page ⇒ likely pulls full feature set early. *Hypothesis: measurable win possible; measure before changing.*
2. **Client boundaries:** 21/117 `src` files are `"use client"`, including whole static pages (`about`, `faq`, `privacy`, `terms`, `sitemap-ui`). Some may not need page-level client. *Hypothesis; verify interactivity needs first.*
3. **Home page is server-rendered** with client islands (`HeroCTA`, `BottomCTA`, `HeroVisual`) — already good.
4. **TensorFlow.js** is dynamically imported and only loaded when classification components mount — already good. The model (~7.8 MB) is precached by the SW (install cost vs offline benefit — keep, it is an explicit product capability).
5. **Leaflet** is dynamically imported with `ssr: false` on `/map` — already good. `recharts` only used in dashboard charts.
6. **Unused dependencies** (not imported anywhere in `src/`): `react-markdown`, `remark-gfm`, `rehype-raw`, `@tensorflow/tfjs-node`, `@tensorflow/tfjs-converter`, `@tensorflow/tfjs-core` (tfjs meta-package covers runtime use). *Locked decision: document as debt; do not remove now.*
7. **Unused public assets** precached by the SW: `next.svg`, `vercel.svg`, `window.svg`, `file.svg`, `globe.svg`, `site.webmanifest`. `logo.png`, `hero-recycle.svg`, `my-favicon.ico` **are** used.
8. **Images:** education thumbnails use `next/image` with `sizes` + eager-first-6 — good; article hero uses fixed width/height — good.
9. **Fonts:** `next/font` Geist with `display: swap` — good; no manual font links.
10. **API-waterfall hypothesis:** education list triggers load on mount + a duplicate effect on `searchQuery` change (two effects both call `loadArticles`; the 500 ms debounce effect re-runs after the mount effect) ⇒ possible duplicate fetches on first interaction. *Observation from code; verify in runtime profiling.*

---

## 10. Git / working-tree state (as of audit start)

### 10.1 Commands and results [Confirmed]

```
$ git status --short --branch
## chore/modernize-pwa
 M bun.lock
 M public/sw.js

$ git diff --stat
 bun.lock     | 33 ++++++++++++++++-----------------
 public/sw.js |  2 +-
 2 files changed, 17 insertions(+), 18 deletions(-)
```

- `bun.lock` (+16/−17): real content change upgrading **next 15.4.7 → 15.4.8**, `eslint-config-next` 15.4.7 → 15.4.8, `caniuse-lite` bump, bun `configVersion: 0`. This aligns the lockfile with `package.json` (`next: 15.4.8`). **User work — preserved.**
- `public/sw.js` (1 line changed): regenerated artifact; config identical to committed version, different build chunk hashes. Full diff archived at `/tmp/opencode/public-sw.worktree.diff`.
- No untracked files. No other modifications.

### 10.2 Backups created before any build [Confirmed]

```
/tmp/opencode/sw.js.pre-baseline           (12.9 KB)
/tmp/opencode/workbox-c18c662b.js.pre-baseline (21.7 KB)
/tmp/opencode/bun.lock.pre-baseline        (426.4 KB)
/tmp/opencode/public-sw.worktree.diff      (26,189 bytes)
```

### 10.3 Tracked generated/artifact files [Confirmed]

`git ls-files` → `public/sw.js`, `public/workbox-c18c662b.js`, `public/manifest.json`, `public/site.webmanifest`, `bun.lock`, `package-lock.json`, `all_files.txt`.

- **Generated, should be untracked + ignored in Step 3:** `public/sw.js`, `public/workbox-*.js`.
- **Candidate artifact:** `all_files.txt` (repo listing dev file; also `used_files.txt` already gitignored).
- **Lockfile decision:** Bun canonical ⇒ remove `package-lock.json` from tracking (Step 3, with approval).

---

## 11. Risks

| ID | Severity | Risk | Type |
|---|---|---|---|
| R1 | LOW | No global ignores in the flat config → repo-wide ESLint invocations (`eslint .`, IDE) flag generated artifacts. `next lint` itself passes (baseline §Lint). Add ignores as hardening. | Tooling |
| R2 | HIGH | Stored XSS in education article renderer (unescaped `dangerouslySetInnerHTML`); approved to fix in Step 9. | Security (pre-existing) |
| R3 | MED–HIGH | Generated SW committed + dirty tree → merge conflicts, stale SW confusion, review noise. | Repo hygiene |
| R4 | MED | Offline deep links fail (no fallback page/routes beyond `/`). | PWA UX |
| R5 | MED | `/api/education/public` cached un-narrowed → session-variant responses could be reused (single-device scope). | Cache/session |
| R6 | MED | Local production build **confirmed** env-dependent (`.env` empty, no `.env.local`): fails without `DATABASE_URL` (module-scope `neon()` in `src/db.ts`, at page-data collection) and without Clerk publishable key (prerendering `/faq`). With placeholder env the build fully succeeds → environmental, not a regression. See `docs/modernization-baseline.md`. | Environment |
| R7 | MED | `skipWaiting` + `clientsClaim` with no update notice; users may get a new SW mid-session. | PWA lifecycle |
| R8 | MED | Dead blocking overlay (`loading-overlay` + `use-global-loading`) could be accidentally revived; navigation loader can stick on modified clicks. | Loading UX |
| R9 | MED | Client-only AdminGuard vs API authorship model; draft `[id]` read; unauth tips POST. | Security (pre-existing, doc-only) |
| R10 | LOW | `site.webmanifest` stale duplicate precached; unused boilerplate assets precached. | Hygiene |
| R11 | LOW | No-op inngest self-rewrite; `all_files.txt`; dual lockfiles; unused deps. | Hygiene |
| R12 | LOW | `maximumScale: 1` / `userScalable: false` (pre-existing a11y choice, not changed without approval). | A11y |
| R13 | INFO | PWA disabled in dev (`disable: NODE_ENV === development`) → SW testing requires `bun run build && bun run start`. | Testing |

---

## 12. Recommended cleanup actions (Step 3 — locked, not executed here)

> **Step 3 status (2026-10-06):** completed — ESLint ignores (item 1), SW artifacts untracked/ignored (item 2), `package-lock.json` untracked/ignored + README → Bun (item 3, except the optional `typecheck` npm script which remains deferred), dead loading files removed + navigation hook hardened (item 4), `site.webmanifest` removed (item 5), verification re-run (item 7). Optional item 6 (boilerplate SVGs, no-op inngest rewrite, `all_files.txt`) is deferred. See `docs/modernization-cleanup.md`. This section is preserved as the original recommendation record.

1. `eslint.config.mjs`: add global ignores `.next/**`, `public/sw.js`, `public/workbox-*.js`, `drizzle/**` as hardening so repo-wide ESLint invocations never lint generated output (`next lint` already passes; base step targeted `src` only).
2. Untrack `public/sw.js` + `public/workbox-*.js`; add to `.gitignore` (build still regenerates; Vercel unaffected).
3. Remove `package-lock.json` from tracking; README → Bun commands; add `"typecheck": "tsc --noEmit"` script.
4. Delete dead `src/components/loading-overlay.tsx` + `src/hooks/use-global-loading.ts`; harden `use-navigation-loading` (button/modifier-key guard + safety reset + query-aware compare).
5. Delete `public/site.webmanifest` (verify no external reference first) — superseded by Step 4 manifest migration.
6. Optional (needs approval): remove unused boilerplate SVGs; drop no-op inngest rewrite; remove/replace `all_files.txt`.
7. Re-run `bun run lint` + `bunx tsc --noEmit` + `bun run build` after cleanup.

---

## 13. Recommended PWA architecture (locked)

1. **Manifest:** migrate to typed `src/app/manifest.ts` (same branding/icons, `any maskable` kept); delete `public/manifest.json` + `public/site.webmanifest`; verify Next auto-injects or keep explicit metadata link.
2. **SW generation:** keep `@ducanh2912/next-pwa` (Workbox 7 already bundled — no new dependencies). SW scope `/`, output `/sw.js`.
3. **Runtime strategies:** per §5 table (model CacheFirst; images SWR exact-host; public read-only APIs NetworkFirst narrow; everything auth/AI/write NetworkOnly; explicit `/api/**` catch-all NetworkOnly).
4. **Documents:** NetworkFirst whitelist of public routes only; never `/dashboard`; skip `Set-Cookie` responses; `cacheOnFrontEndNav` stays **off** (RSC).
5. **Offline UX:** `src/app/offline/page.tsx` ("Kamu sedang offline / Periksa koneksi internetmu dan coba lagi." + retry) wired via `fallbacks.document` with a deterministic precache entry; app remains fully functional without SW APIs.
6. **Lifecycle:** keep `skipWaiting`/`clientsClaim` + `cleanupOutdatedCaches`; add update notice on `controllerchange` (no toast on first install); `registration.update()` on visibility change; versioned cache names.
7. **Install UX:** typed `use-install-prompt` hook (`BeforeInstallPromptEvent`, no `any`), subtle navbar affordance, dismissal memory, `appinstalled`, graceful on iOS (no `beforeinstallprompt`).
8. **Verification:** DevTools Application panel (manifest/SW/cache storage), offline matrix, classification-never-broken checks, Lighthouse before/after.

## 14. Files that must NOT be modified in later phases (unless separately approved)

- **Auth:** `src/middleware.ts`, Clerk provider/usage in `src/app/layout.tsx`, `src/components/dashboard/auth-guard.tsx`, `src/components/admin-guard.tsx`.
- **Database:** `src/db.ts`, `src/db/schema.ts`, `drizzle.config.ts`, `drizzle/**`.
- **AI:** `src/lib/classifier-browser.ts`, `src/hooks/use-classification.ts`, `src/hooks/use-model-status.ts`, `src/lib/gemini-ai.ts`, `src/lib/inngest*.ts`, `src/lib/inngest/functions.ts`, `public/model/**`.
- **API contracts:** all `src/app/api/**/route.ts` files (education security items are documentation-only; XSS fix is confined to the education **page** renderer in Step 9).
- **Business logic:** classification/upload/camera components, waste-banks logic, education utils.
- **Approved exceptions by design:** `next.config.ts` (PWA block only — leave `headers`, `images`, `rewrites`, `allowedDevOrigins` semantics intact), `src/app/layout.tsx` (manifest link + update-notice mount only), `eslint.config.mjs`, `.gitignore`, `package.json` (scripts only), README.

---

## Unresolved questions

1. Does local `bun run build` succeed without Clerk env keys? → Step 2 baseline will answer; if it fails, Step 15 (PWA testing) needs a `.env.local` with test keys (ask before creating).
2. Exact SW registration snippet injected by `register: true` → verify at runtime in the PWA verification phase.
3. Education authorization intent (admin-only vs self-serve authors) → product decision; documented, out of scope.
4. Whether `/api/education/public/[id]` draft exposure + unauthenticated tips POST are accepted risks → separately tracked security follow-up.

---

_Facts in this document were gathered by direct file inspection and the commands listed in §10; runtime behavior (SW registration, caching, offline flows, build) was **not** tested in Step 1 and is explicitly marked where inferred._
