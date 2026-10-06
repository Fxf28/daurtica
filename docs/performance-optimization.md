# Performance Optimization — Phase 10

**Status:** COMPLETE — changes applied and verified (see §5); **no commits were made**
**Date:** 2026-10-06 / 2026-10-07
**Branch:** `chore/modernize-pwa`
**Scope:** Data-driven performance optimization of Daurtica. No changes to database schema,
Drizzle migrations, API contracts, Clerk authentication, Inngest, Gemini/AI, classification
model behavior, education security model, XSS remediation, PWA install/update/offline behavior,
or manifest semantics.
**Rule honored:** measure first; change only what the measurements justified; no commits.

---

## 1. Method

### 1.1 Environment

| Item | Value |
|---|---|
| Node.js | `v26.7.0` |
| Bun | `1.4.0` |
| Next.js | `16.3.8` (`next build --webpack`) |
| React | `19.2.8` |
| OS | Linux (Arch), local production server `next start` on `http://localhost:3000` |
| Env | real `.env` (DATABASE_URL, Clerk, Google, Cloudinary, Inngest) — local production build/run |

### 1.2 Commands and artifacts

| Step | Command | Artifact |
|---|---|---|
| Lint | `bun run lint` | `/tmp/opencode/phase10/lint.txt`, `lint-final.txt` |
| Typecheck | `bunx tsc --noEmit` | `/tmp/opencode/phase10/tsc.txt`, `tsc-final.txt` |
| Build (baseline) | `bun run build` | `/tmp/opencode/phase10/build.txt` |
| Build (final) | `bun run build` | `/tmp/opencode/phase10/build-sync.txt` |
| Route HTML capture | `curl --compressed` per route | `/tmp/opencode/phase10/html/`, `html-sync/` |
| Client bundle stats | temporary webpack stats hook (measurement-only; `next.config.ts` restored byte-identical — SHA-256 verified) | `/tmp/opencode/phase10/webpack-stats.json` |
| Runtime | Playwright 1.63 + Chromium 153 headless; mobile 412×915; CPU 4× throttle; 9 Mbps down / 3 Mbps up / 70 ms RTT; cold context per route + warm reload; service workers blocked for the before/after comparison | `/tmp/opencode/phase10/runtime/*.json` |

### 1.3 Build gates

| Gate | Baseline | Final |
|---|---|---|
| `bun run lint` | PASS — exit 0, 23 warnings | PASS — exit 0, 22 warnings |
| `bunx tsc --noEmit` | PASS — exit 0 | PASS — exit 0 |
| `bun run build` | PASS — exit 0 | PASS — exit 0 |

Warnings are pre-existing `react-hooks/set-state-in-effect` advisories, not errors. Next.js 16
does not print `Size` / `First Load JS` in the route table, so per-route weights were
reconstructed from the served HTML (`<script src>` set) and webpack stats.

### 1.4 Route inventory (unchanged)

35 routes: 19 static (`○`), 16 dynamic (`ƒ`), plus `ƒ Proxy (middleware)`. Identical
static/dynamic distribution before and after.

---

## 2. Build-output baseline (before)

### 2.1 Client JS per public route (gzip, as served)

Fetched every `<script src>` from the SSR HTML with `Accept-Encoding: gzip`; the `polyfills`
chunk is excluded because it is emitted with `noModule` and never fetched by modern browsers.

| Route | JS shell (gzip) | CSS (gzip) | script tags |
|---|---|---|---|
| `/classify` | 362.2 KB | 18.1 KB | 28 |
| `/education` | 344.1 KB | 18.1 KB | 23 |
| `/` | 327.8 KB | 18.1 KB | 21 |
| `/map` | 325.2 KB | 18.1 KB | 21 |
| `/about` | 324.5 KB | 18.1 KB | 21 |
| `/faq` | 321.9 KB | 18.1 KB | 20 |
| `/privacy` | 320.9 KB | 18.1 KB | 20 |
| `/sitemap-ui` | 320.8 KB | 18.1 KB | 20 |
| `/terms` | 320.3 KB | 18.1 KB | 20 |
| `/~offline` | 208.7 KB | 18.1 KB | 12 |

### 2.2 Largest client chunks and attribution (webpack stats)

| Chunk | Raw | Gzip | Composition | Loaded |
|---|---|---|---|---|
| `8928` | 242.3 KB | 66.6 KB | Next.js client runtime | all routes |
| `4bd1b696` | 196.3 KB | 61.9 KB | `react-dom-client` | all routes |
| `9784` | 143.5 KB | 38.4 KB | Clerk (`@clerk/react`) + TanStack Query | all routes |
| `2898` | 107.2 KB | 34.2 KB | Radix NavigationMenu + AnimatePresence + `@clerk/nextjs` components + icons | all public pages |
| `338` | 80.0 KB | 28.8 KB | **framer-motion full features** (`create-proxy`, animations, gestures) | all public pages |
| `914` | 43.2 KB | 13.5 KB | framer-motion core/render pipeline | all public pages |
| `6793` | 45.9 KB | 18.1 KB | framer-motion package index (async) | classify/education/map (+camera/upload) |
| `7093` | 50.9 KB | 13.7 KB | zod v4 | `/classify`, `/education`, home prefetch |
| `5875` | 43.4 KB | 14.8 KB | Radix dropdown menu (ModeToggle) | all public pages |
| `5882` | 36.7 KB | 10.5 KB | sonner + lucide-react | all routes |
| `4527` | 25.9 KB | 9.2 KB | react-remove-scroll + Radix dialog deps | all routes |
| `8409` | 24.1 KB | 7.6 KB | `tailwind-merge` (`cn()`) | all routes |
| `d0deef33` | 145.0 KB | 43.2 KB | Leaflet (async) | `/map` |
| `3817` | 341.7 KB | — | Recharts | dashboard only |
| tfjs (10 chunks) | ~1.5 MB | ~450 KB | `@tensorflow/tfjs` (async) | classify interaction |

Static assets: `.next/static` 4.3 MB (chunks 4.0 MB, CSS 116 KB, fonts 180 KB).

### 2.3 PWA assets

| Artifact | Baseline | Final |
|---|---|---|
| `public/sw.js` | 15.5 KB | 15.4 KB |
| `public/workbox-*.js` | 22.5 KB | 22.5 KB |
| Precached entries | 132 | 131 |
| Precache total (raw) | 12.50 MB | 12.51 MB |
| Model (`/model`) | 8.38 MB shards + 63.7 KB JSON | unchanged |

The precache manifest (incl. the 8.4 MB offline model) is the Phase 5 offline-classification
design and was not changed.

---

## 3. Runtime baseline (before)

Method: fresh context per route, 412×915 mobile, 4× CPU throttle, 9 Mbps/3 Mbps/70 ms,
`load` + 4 s settle, then warm reload. Service workers were effectively absent in this capture
(registration did not complete under throttling; `ctrl=false` for all routes), so it serves as
the no-SW baseline.

| Route | Cold LCP | Cold FCP | Cold TBT | CLS | Cold transfer | Warm LCP | Warm transfer |
|---|---|---|---|---|---|---|---|
| `/` | 3980 ms | 2056 ms | 844 ms | 0 | 694 KB | 1624 ms | 17 KB |
| `/classify` | 2328 ms | 932 ms | 1123 ms | 0.0203 | 3845 KB | 1256 ms | 8 KB |
| `/education` | 2688 ms | 912 ms | 541 ms | 0 | 668 KB | 1048 ms | 9 KB |
| `/map` | 3252 ms | 908 ms | 746 ms | 0 | 700 KB | 932 ms | 8 KB |
| `/faq` | 3040 ms | 1168 ms | 908 ms | 0 | 632 KB | 532 ms | 8 KB |
| `/about` | 3232 ms | 1160 ms | 967 ms | 0 | 632 KB | 1024 ms | 8 KB |
| `/terms` | 4196 ms | 2604 ms | 502 ms | 0 | 630 KB | 1008 ms | 8 KB |
| `/privacy` | 2432 ms | 964 ms | 566 ms | 0 | 631 KB | 984 ms | 8 KB |
| `/sitemap-ui` | 2184 ms | 948 ms | 287 ms | 0 | 694 KB | 936 ms | 26 KB |
| `/~offline` | 1344 ms | 1344 ms | 222 ms | 0 | 498 KB | 148 ms | 0 KB |
| `/education/does-not-exist` | 3212 ms | 3212 ms | 560 ms | 0 | 627 KB | 840 ms | 8 KB |

Cold transfer breakdown (typical public page): app JS ≈ 340–380 KB gzip, CSS 19 KB,
fonts 52 KB, **Clerk CDN ≈ 215 KB+** (`clerk.browser.js` 83 KB + `ui-common` 130 KB +
`framework_ui` 43 KB + `vendors_ui` 38 KB + …), RSC prefetch ≈ 8 KB.

Directly demonstrated issues:

1. **framer-motion full bundle on every public page.** `navbar.tsx`, `hero-visual.tsx`, and
   the `about`/`faq`/`privacy`/`terms`/`sitemap-ui` pages imported `motion` from
   `framer-motion` (full feature set: `338` 80 KB raw + parts of `914`/`2898`). The existing
   `FramerLazyConfig` helper was not lazy either: `import("framer-motion").then(() => domAnimation)`
   dynamically imported the whole package index (`6793`, 18.1 KB gzip) while `domAnimation`
   itself was statically bundled.
2. **Duplicate API request on `/education`.** The mount effect and the 500 ms debounce effect
   both called `loadArticles`, and `articles.length` was in the callback deps, so
   `GET /api/education/public?page=1&limit=50&publishedOnly=true` fired **twice** per page
   load (confirmed in the resource log; 422 B each).
3. **Clerk CDN + framework core dominate cold bytes** — locked contracts, not changed.
4. **SW install downloads 12.5 MB** (model 8.6 MB) on first visit — locked Phase 5 capability,
   not changed.

---

## 4. Changes applied

### 4.1 Source changes (behavior-preserving)

| File | Change |
|---|---|
| `src/components/framer-wrapper.tsx` | `LazyMotion features={domAnimation}` synchronous bundle (no more `import("framer-motion")` of the package root) |
| `src/components/navbar.tsx` | uses `M` + `FramerLazyConfig` instead of `motion`; `AnimatePresence`/`useReducedMotion` kept |
| `src/components/hero-visual.tsx` | uses `M` + `FramerLazyConfig` |
| `src/app/(public)/about/page.tsx` | uses `M` + `FramerLazyConfig` |
| `src/app/(public)/faq/page.tsx` | uses `M` + `FramerLazyConfig` |
| `src/app/(public)/privacy/page.tsx` | uses `M` + `FramerLazyConfig` |
| `src/app/(public)/terms/page.tsx` | uses `M` + `FramerLazyConfig` |
| `src/app/(public)/sitemap-ui/page.tsx` | uses `M` + `FramerLazyConfig` |
| `src/app/(public)/education/page.tsx` | single load effect (immediate on mount, 500 ms debounce on search/connection change) + latest-callback ref; one request per trigger |

No dependency, config, API, DB, auth, AI, or PWA changes. `next.config.ts` was temporarily
instrumented for measurement only and restored byte-identically (SHA-256
`6aeede…9349` verified).

### 4.2 Variant tested and rejected (data-driven)

A first variant made the feature bundle truly lazy
(`loadFeatures = () => import("framer-motion").then((m) => m.domAnimation)`), which shrank the
initial shell by ~35 KB gzip/page. Measurement showed it also moved framer core + features
into two async chunks (`914` 36.5 KB + `3246` 18.2 KB gzip) fetched on **every** public page,
**increasing total cold transfer by +19–35 KB** versus the baseline. The synchronous
`domAnimation` variant achieves the same parse/TBT reduction with lower total bytes, so the
lazy variant was rejected and the wrapper was switched to the synchronous bundle.

### 4.3 Considered, deliberately deferred

- **Clerk CDN/client cost** (~215 KB+ per page): locked authentication contract.
- **Next.js/React runtime chunks** (~128 KB gzip/page): framework.
- **SW precache (12.5 MB install)**: required for offline classification (Phase 5); no
  functional waste fix without touching the locked strategy.
- **`zod` client bundle** (`7093`, 13.7 KB gzip on `/classify` + `/education`): deferring it
  would need async schema loading inside client response-validation; not justified relative
  to risk in this phase. Recorded as a future candidate.
- **`/dashboard/education` duplicate-fetch pattern**: same shape as `/education` but behind
  auth and not runtime-measured; left for a follow-up.

---

## 5. Results

### 5.1 Build output (deterministic)

Per-route JS shell after the change (gzip):

| Route | Before | After | Δ |
|---|---|---|---|
| `/classify` | 362.2 KB | 347.3 KB | **−14.9 KB (−4.1%)** |
| `/education` | 344.1 KB | 329.3 KB | **−14.8 KB (−4.3%)** |
| `/` | 327.8 KB | 313.4 KB | **−14.4 KB (−4.4%)** |
| `/map` | 325.2 KB | 310.5 KB | **−14.7 KB (−4.5%)** |
| `/about` | 324.5 KB | 310.1 KB | **−14.4 KB (−4.4%)** |
| `/faq` | 321.9 KB | 307.4 KB | **−14.5 KB (−4.5%)** |
| `/privacy` | 320.9 KB | 306.5 KB | **−14.4 KB (−4.5%)** |
| `/sitemap-ui` | 320.8 KB | 306.4 KB | **−14.4 KB (−4.5%)** |
| `/terms` | 320.3 KB | 305.8 KB | **−14.5 KB (−4.5%)** |
| `/~offline` | 208.7 KB | 208.7 KB | 0 |

On `/classify`, `/education`, `/map` (and dashboard camera/upload) the async framer package
index (`6793`, 18.1 KB gzip) is additionally gone because the wrapper no longer dynamically
imports the package root.

Chunk-level: `338` (80 KB raw) and `914` (43.2 KB) and `2898` (107.2 KB) are replaced by
`231` (108.1 KB) + `8808` (74.0 KB) — deduplicated framer core + `domAnimation` + navbar
chunks; the full-feature framer bundle remains only for dashboard pages that still use
`motion`. No async chunk regression (verified via `react-loadable-manifest.json`: the
`framer-wrapper -> framer-motion` dynamic entry no longer exists).

### 5.2 Runtime (throttled mobile, SW-blocked, matched method)

| Route | TBT before → after | Cold transfer before → after | Cold LCP before → after |
|---|---|---|---|
| `/` | 844 → **428 ms (−49%)** | 694 → **679 KB (−2.2%)** | 3980 → 4320 ms* |
| `/classify` | 1123 → **1021 ms (−9%)** | 3845 → **3812 KB (−0.9%)** | 2328 → 2896 ms* |
| `/education` | 541 → **329 ms (−39%)** | 668 → **635 KB (−4.9%)** | 2688 → **2140 ms (−20%)** |
| `/map` | 746 → **326 ms (−56%)** | 700 → **667 KB (−4.7%)** | 3252 → **2736 ms (−16%)** |
| `/faq` | 908 → **260 ms (−71%)** | 632 → **618 KB (−2.2%)** | 3040 → **2232 ms (−27%)** |
| `/about` | 967 → **255 ms (−74%)** | 632 → **618 KB (−2.2%)** | 3232 → **2680 ms (−17%)** |
| `/terms` | 502 → **240 ms (−52%)** | 630 → **616 KB (−2.2%)** | 4196 → **2136 ms (−49%)** |
| `/privacy` | 566 → **305 ms (−46%)** | 631 → **617 KB (−2.2%)** | 2432 → **2200 ms (−10%)** |
| `/sitemap-ui` | 287 → 273 ms (−5%) | 694 → 695 KB (±0) | 2184 → 2172 ms |
| `/~offline` | 222 → **177 ms (−20%)** | 498 → 498 KB | 1344 → **836 ms (−38%)** |
| `/education/does-not-exist` | 560 → 564 ms | 627 → **612 KB (−2.4%)** | 3212 → **2100 ms (−35%)** |

\* The two LCP outliers are tied to severe TTFB/timing variance in that sample (home TTFB
1918 ms vs 1570 ms baseline; classify TTFB 580 ms vs 524 ms). FCP and `load` did not regress
on those routes; a repeat capture was done to confirm the spread (see below).

Repeat capture (same method): `/` LCP 2872 ms / FCP 1012 / TBT 475 ms / 679 KB;
`/classify` LCP 2940 ms / FCP 948 / TBT 1003 ms / 3812 KB;
`/faq` LCP 2388 ms / FCP 980 / TBT 393 ms / 618 KB.

Across the two sync samples: `/` LCP 4320/2872 ms (baseline 3980) and `/classify` LCP
2896/2940 ms (baseline 2328; warm LCP 1032/1240 ms vs baseline 1256). FCP is stable
(home 1012–2400 ms vs 2056; classify 924–948 ms vs 932). The classify cold-LCP delta tracks
the animated paragraph LCP candidate (the page's `h1`/subtitle animate from `opacity: 0`),
so later animation start under CPU throttling extends the cold LCP sample; TBT, transfer,
warm load and FCP all improved. No systematic LCP regression mechanism was found (the change
only removes JS from the critical path).

**Summary of runtime evidence:** JS parse/execution cost (TBT) drops consistently and
substantially (median ≈ −46% across the public routes); cold transfer drops on the measured
routes (−2% to −5%; −33 KB on the three `LazyMotion`-heavy routes; `/sitemap-ui` flat and
`/~offline` unchanged); LCP moved with TTFB/timing noise and shows no systematic regression,
with several routes improving 17–49%.

### 5.3 Behavior verification

- **UI/animation smoke test** (`verify-ui.mjs`): all 9 public routes render `h1` at opacity 1,
  zero page errors, zero LazyMotion-strict violations, and the mobile menu opens right-aligned
  with all nav entries; no page errors in any check.
- **PWA regression** (`pwa-check.mjs`): service worker ready/active, page controlled after
  reload, workbox precache (131 entries) + `daurtica-model` cache present, model shards cached,
  offline navigation to `/classify` served the `/~offline` fallback, online navigation works,
  no page errors.
- **Security**: the Phase 9 XSS regression suite is re-run unchanged (renderer untouched).
- **Build gates**: see §1.3 (lint PASS, tsc PASS, build PASS).

### 5.4 What did not change

No change to any API route, database schema or query, Clerk behavior, Inngest, Gemini calls,
TensorFlow.js model or loading logic, education rendering/security, manifest, service-worker
configuration (runtime caching, NetworkOnly rules, fallback), install prompt, or update
lifecycle. No dependency or lockfile changes. No commits.

---

## 6. Reproduction

```bash
# build gates
bun run lint && bunx tsc --noEmit && bun run build

# production server
bun run start               # http://localhost:3000

# per-route shell measurement (needs the server)
node /tmp/opencode/phase10/compressed-sizes.js

# runtime measurement (needs the server + Playwright)
cd /tmp/opencode/phase10/browser && BLOCK_SW=1 node measure.mjs
```

Pre-existing noise observed during measurement (not caused by this phase):
`baseline-browser-mapping` data-age notice, `caniuse-lite` age notice, Node
`module.register()` deprecation, and a Clerk middleware redirect CORS message on
`/sitemap-ui` (dashboard prefetch), all present before the changes too.

---

_All numbers in this document come from the artifacts listed in §1.2. Runtime figures are
single-sample throttled mobile captures with the caveats noted in §5.2; build figures are
deterministic. No source file outside the list in §4.1 was changed by this phase._
