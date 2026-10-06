# Next.js 16.3.8 + Clerk 7.9.11 — Security Migration

> **Type:** Security patch + major framework migration (explicit project decision)
> **Date:** 2026-10-06
> **Branch:** `chore/modernize-pwa` (no commits made)
> **Scope:** upgrade Next.js/React/Clerk/ESLint-config, migrate Clerk Core 3 code, preserve PWA/DB/Inngest behavior. No PWA Phase 5 work.

## 1. Migration summary

```text
Next.js:           15.4.8  → 16.3.8      (exact)
React:             19.1.0  → 19.2.8      (exact)
React DOM:         19.1.0  → 19.2.8      (exact)
@clerk/nextjs:     6.32.2  → ^7.9.11     (Core 3)
eslint-config-next:15.4.8  → 16.3.8      (exact)
@types/react:      19.1.10 → 19.2.18     (~19.2)
@types/react-dom:  19.1.7  → 19.2.7      (~19.2)
```

Scripts (`package.json`): `dev: next dev` (Turbopack default), `build: next build --webpack` (required for next-pwa), `lint: eslint .` (`next lint` removed in 16).

`tsconfig.json` was auto-updated by Next 16 during the build (mandatory `jsx: "preserve"` → `"react-jsx"`, plus `.next/dev/types/**/*.ts` added to `include`; formatting normalized by Next).

## 2. Security rationale

| Advisory | Severity | Issue | Fixed in | Resolved by 16.3.8 |
|---|---|---|---|---|
| `GHSA-mwv6-3258-q52c` | High | DoS with Server Components | 15.4.9 | ✅ |
| `GHSA-w37m-7fhw-fmv9` | Moderate | Server Actions source code exposure | 15.4.9 | ✅ |
| `GHSA-8h8q-6873-q5fj` | High | DoS with Server Components (RSC deserialization, CVE-2026-23870) | 15.5.16 | ✅ |

**Target selection rationale (and documented override):** the earlier modernization guidance recommended staying on the Next.js 15 line and patching to `15.5.27` (which would also have resolved all three advisories, since fixes were backported). The project explicitly chose **Next.js 16.3.8** — the latest stable at decision time — overriding that recommendation. This converts a security patch into a **major migration** (Turbopack-default builds, `next lint` removal, `middleware`→`proxy` deprecation, Clerk Core 3). The trade-off was accepted explicitly by the project owner; this document records it.

Compatibility pre-checks that made 16.3.8 viable: Node 26 (≥20.9 required), TS 5.9.2 (≥5.1), `@ducanh2912/next-pwa@10.2.9` peer `next >=14` (kept unchanged), Clerk v7 `next ^16.0.10` support, React 19.2.8 satisfying Clerk's `~19.2.3` peer range.

## 3. Clerk migration (Core 3 / v7)

Tooling: `bunx @clerk/upgrade --sdk=nextjs --release=core-3 --skip-upgrade` (dry-run reviewed first; `--skip-upgrade` used because dependencies were installed explicitly).

Codemod changes (reviewed, then manually corrected):

- `src/components/navbar.tsx`: 4× `SignedIn`/`SignedOut` → `Show when="signed-in"|"signed-out"`; import updated. Desktop + mobile UI preserved exactly.
- `src/app/layout.tsx`: `ClerkProvider` moved **inside `<body>`** (required by Core 3); codemod's formatting cleaned up manually. All metadata, JSON-LD, providers, Toaster untouched.

Manual verification:

- `ClerkProvider afterSignOutUrl="/"` **preserved** — documented v7 replacement target (types verified; `tsc` passes).
- `src/components/dashboard/dashboard-sidebar.tsx` `<SignOutButton redirectUrl="/">` **preserved** — documented v7 pattern (codemod left it unchanged; scanner flag reviewed as a false positive).
- Unchanged and verified working: `SignInButton`, `SignUpButton`, `UserButton`, `SignOutButton`, `ClerkLoaded`, `ClerkLoading`, `useUser`, `auth`, `currentUser`, `clerkMiddleware`.
- `src/middleware.ts` kept as-is (Next 16 deprecation warning documented below). `auth.protect()` server-action 401-vs-404 change noted (informational; middleware page protection unaffected).
- Runtime: unauthenticated `/dashboard` with a browser-like `Accept: text/html` → **307 redirect to the Clerk handshake** (middleware + v7 verified). A non-document request (`Accept: */*`) returns 404 by design.

## 4. PWA compatibility

- `@ducanh2912/next-pwa@10.2.9` **unchanged** (version, config, cache rules all untouched).
- Next 16 defaults builds to Turbopack, which conflicts with webpack-based plugins; `build` now runs `next build --webpack` (documented opt-out) — PWA plugin executed normally:
  - `✓ (pwa) Compiling for server/client…` + `○ (pwa) Service worker: public/sw.js` emitted
  - `public/sw.js` regenerated (13.0 KB), `public/workbox-c18c662b.js` intact
- Dev uses Turbopack; the PWA plugin is disabled in development (`disable: NODE_ENV === "development"`) so there is no conflict.
- No PWA architecture changes; Phase 5 (cache strategy/offline/install/update) remains untouched.

## 5. Verification

| Check | Result |
|---|---|
| `bun run lint` (`eslint .`) | ✅ PASS — 0 errors, 21 warnings (see §6) |
| `bunx tsc --noEmit` | ✅ PASS (after Next's tsconfig auto-update) |
| `bun run build` (`next build --webpack`) | ✅ PASS — 28/28 generated; route table identical to the Next 15 build (35 routes, same static/dynamic markers); size columns removed by Next 16 |
| Pages smoke (`/`, `/classify`, `/education`, `/map`, `/faq`) | ✅ all HTTP 200 |
| `/api/waste-banks?limit=1` | ✅ HTTP 200, valid JSON (live Neon) |
| `/api/inngest` methods | ✅ compiled `userland`: `GET, POST, PUT`. PATCH → 405, DELETE → 405. GET/POST → 401, PUT → 400 (Inngest signature layer). OPTIONS → **204 auto-answered by Next.js** with `allow: GET, HEAD, OPTIONS, POST, PUT` — never reaches the Inngest handler (framework behavior; the advisory required unhandled methods to reach the SDK handler) |
| `/dashboard` (unauth, browser-like) | ✅ 307 → Clerk handshake; no 500 |
| PWA generation | ✅ SW emitted + regenerated |
| `bun audit` | ✅ all three advisories gone (0 matches); no remaining `next@`/`@clerk` advisory sections; total repo findings 162 → 121 (remaining are pre-existing transitive/dev-tooling issues, out of scope) |

ESLint config migration (required): `FlatCompat` + legacy `next/core-web-vitals` no longer works with `eslint-config-next@16`. `eslint.config.mjs` migrated to the flat-native form (`import nextCoreWebVitals from "eslint-config-next/core-web-vitals"` + `...nextTypescript`), preserving the Step-3 global ignores (`.next/**`, `public/sw.js`, `public/workbox-*.js`, `drizzle/**`).

One real finding fixed: `src/components/test-education-generate.tsx` referenced `loadUsageInfo` in a `useEffect` before its declaration (new `react-hooks/immutability` rule) — declaration reordered, behavior unchanged.

## 6. Remaining risks

1. **`middleware.ts` deprecation** — Next 16 warns: *"The 'middleware' file convention is deprecated. Please use 'proxy' instead."* Kept intentionally (Clerk/edge-runtime compatibility); the build labels it `ƒ Proxy (Middleware)`. Migration to `proxy.ts` should be a dedicated future task (note: `proxy` is Node.js-runtime only; edge runtime requires keeping `middleware.ts`).
2. **Edge Runtime warning (non-fatal)** — build warns that `process.cwd` is used via `@clerk/nextjs` middleware import chain in the Edge Runtime. Middleware still executed correctly in runtime tests; monitor on deployment.
3. **21 lint warnings** — `react-hooks/set-state-in-effect` (new compiler-era rule from react-hooks v7) fires on pre-existing fetch-on-mount patterns across 12 files. Downgraded to `warn` in `eslint.config.mjs` with a comment; a dedicated refactor is deferred (React Compiler is not enabled).
4. **Remaining `bun audit` findings (121)** — pre-existing transitive/dev-tooling advisories (node-tar, webpack via next-pwa, OTel/uuid, etc.); not part of this phase.
5. **Build output metrics** — Next 16 removed `Size`/`First Load JS` from build output; performance comparisons now require Lighthouse/Core Web Vitals (planned for the performance phase).
6. **Turbopack/webpack split** — dev (Turbopack) vs build (`--webpack`, required by next-pwa) is intentional; revisit only if next-pwa gains Turbopack support.

## Rollback

Backups (pre-migration): `/tmp/opencode/package.json.pre-next16`, `bun.lock.pre-next16`, `layout.tsx.pre-next16`, `navbar.tsx.pre-next16`, `eslint.config.mjs.pre-next16`. No commits were made, so rollback is a file-restore operation; all previous-phase work is preserved and none of it is included in those backups (they cover only files this migration touched, plus `test-education-generate.tsx`/`tsconfig.json` changes which are trivially revertible by hand).
