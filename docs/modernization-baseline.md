# Daurtica — Modernization Baseline

> **Type:** Step 2 baseline capture (as-is repository state, no fixes applied)
> **Date:** 2026-10-06
> **Branch:** `chore/modernize-pwa` (created from `main` @ `0eeaca5`)
> **Purpose:** Record the pre-modernization health of lint / typecheck / build so later steps can distinguish regressions from pre-existing conditions.
> **Rule honored:** no fixes, no cleanup, no dependency changes, no commits were made in this phase.

---

## Environment

| Item | Value |
|---|---|
| Node.js | `v26.7.0` |
| Bun | `1.4.0` |
| OS | Linux `7.1.9-arch1-2` |
| Package manager (canonical) | **Bun** (locked decision) — `bun install` ran clean: "Checked 1414 installs across 1184 packages (no changes)" |
| Lockfiles | `bun.lock` (modified, next 15.4.7 → 15.4.8 sync) + `package-lock.json` (tracked, stale; not removed in this phase) |
| Env files | `.env` exists, **0 bytes**; no `.env.local`; `.gitignore` covers `.env*` |
| Next.js / React | 15.4.8 / 19.1.0 (installed, verified from `node_modules`) |

**Pre-build backups** (created before any regenerating command):

```
/tmp/opencode/sw.js.pre-baseline                (12.9 KB)
/tmp/opencode/workbox-c18c662b.js.pre-baseline  (21.7 KB)
/tmp/opencode/bun.lock.pre-baseline             (426.4 KB)
/tmp/opencode/public-sw.worktree.diff           (25.6 KB)
```

Full outputs saved: `/tmp/opencode/lint-baseline.txt`, `/tmp/opencode/lint-npm-recheck.txt`, `/tmp/opencode/tsc-baseline.txt`, `/tmp/opencode/build-baseline.txt`, `/tmp/opencode/build-baseline-with-env.txt`, `/tmp/opencode/build-baseline-db-only.txt`.

---

## Results

### Lint — ✅ PASS

| Field | Value |
|---|---|
| Command | `bun run lint` (cross-checked with `npm run lint`) |
| Exit code | `0` |
| Output | `✔ No ESLint warnings or errors` (263-byte output; only a `baseline-browser-mapping` data-age notice) |

**Discrepancy resolved.** An earlier apparent lint failure during the audit phase (digest: "1640 errors, 17344 warnings in 203 files", all `.next/**` artifacts) is **not reproducible** and is **not** a `next lint` result:

- Next's CLI (`node_modules/next/dist/cli/next-lint.js`) lints `ESLINT_DEFAULT_DIRS` `['app','pages','components','lib','src']` ∩ existing → **`src` only**; `.next` is never a target. Its ESLint cache lives in `.next/cache/eslint/` (verified present).
- `src/` is clean via direct ESLint: `eslint src --max-warnings=0` → exit 0 (verified twice).
- The digest's per-file numbers exactly match what ESLint reports only when a `.next` artifact is targeted explicitly (e.g. `.next/server/chunks/7770.js` → 1932 problems) — i.e., the digest came from a repo-wide ESLint invocation, not from this command.
- Three consecutive runs across two runners (bun, npm) all pass.

**Latent issue (hardening, Step 3):** `eslint.config.mjs` defines no global ignores, so repo-wide ESLint invocations (e.g. `eslint .`, some IDE integrations) would lint generated output (`.next/**`, `public/sw.js`, `public/workbox-*.js`). `next lint` itself is unaffected.

### Typecheck — ✅ PASS

| Field | Value |
|---|---|
| Command | `bunx tsc --noEmit` |
| Exit code | `0` |
| Output | none (clean) |
| Side effect | `tsconfig.tsbuildinfo` (1.1 MB) created at repo root — matches `.gitignore` `*.tsbuildinfo` |

### Build — ❌ FAIL (as-is environment)

| Field | Value |
|---|---|
| Command | `bun run build` (exact requested command, no env overrides) |
| Exit code | `1` |
| Captured log | `/tmp/opencode/build-baseline.txt` |

Phases reached:

```
✓ (pwa) Compiling for server / client (static)
○ (pwa) Service worker: /home/faiz/daurtica/public/sw.js   [URL: /sw.js, Scope: /]
✓ Compiled successfully in 24.0s
  Linting and checking validity of types ...               [passed — build proceeded]
  Collecting page data ...
✗ Error: No database connection string was provided to `neon()`.
  at .next/server/app/api/education/personal/[id]/generate/route.js
✗ [Error: Failed to collect page data for /api/education/personal/[id]/generate]
```

**Likely cause (confirmed by supplementary diagnostics below):**

- `src/db.ts` constructs the Neon client at **module scope**: `const sql = neon(process.env.DATABASE_URL!)`.
- During "Collecting page data", Next imports route modules; importing that module executes `neon(undefined)` → throws.
- `.env` is empty; no `.env.local` exists.

**Classification: PRE-EXISTING / ENVIRONMENTAL — not a regression, not a code defect in the modernization sense.** The build compiles, lints, and type-checks; it stops only where env-backed modules are imported. Production deployments (e.g. Vercel) provide these variables.

### Supplementary diagnostics (clearly separated from the official baseline)

> These runs used **ephemeral inline environment variables only** — no files were created or modified, no code changes, no dependency changes. They exist to determine whether the env failure masks deeper build issues, and to enumerate what later phases need.

**A. DATABASE_URL only** — `DATABASE_URL='postgresql://...' bun run build` → exit `1`
- Reached "Generating static pages (0/28)" then failed prerendering **`/faq`**: `@clerk/clerk-react: Missing publishableKey`.
- Log: `/tmp/opencode/build-baseline-db-only.txt`.

**B. DATABASE_URL + Clerk keys + placeholders (`GOOGLE_API_KEY`, `CLOUDINARY_*`, `NEXT_PUBLIC_APP_URL`)** → **exit `0`, build SUCCESS**
- Full production build: 28/28 static pages, route table + bundle sizes generated (below).
- Log: `/tmp/opencode/build-baseline-with-env.txt`.

**Conclusion:** with env provided, the repository builds cleanly. No code defects were revealed behind the env failure. Minimum confirmed requirements for a local production build: **`DATABASE_URL`** (confirmed) and **`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`** (confirmed by failure at `/faq`); `CLERK_SECRET_KEY` was included in the successful run but not isolated. `GOOGLE_API_KEY` / Cloudinary / Inngest are optional at build time (code falls back to mocks / lazy config).

---

## Build output details (from successful diagnostic run B)

```
Route (app)                                   Size  First Load JS
┌ ○ /                                       5.26 kB         167 kB
├ ○ /_not-found                                1 kB         104 kB
├ ○ /about                                  1.84 kB         160 kB
├ ƒ /api/classification/history               172 B         103 kB
├ ƒ /api/classification/history/[id]          172 B         103 kB
├ ƒ /api/classification/tips                  172 B         103 kB
├ ƒ /api/education/personal                   172 B         103 kB
├ ƒ /api/education/personal/[id]              172 B         103 kB
├ ƒ /api/education/personal/[id]/generate     172 B         103 kB
├ ƒ /api/education/personal/usage             172 B         103 kB
├ ƒ /api/education/public                     172 B         103 kB
├ ƒ /api/education/public/[id]                172 B         103 kB
├ ƒ /api/education/public/[id]/publish        172 B         103 kB
├ ƒ /api/education/public/slug/[slug]         172 B         103 kB
├ ƒ /api/inngest                              172 B         103 kB
├ ƒ /api/waste-banks                          172 B         103 kB
├ ƒ /api/waste-banks/[id]                     172 B         103 kB
├ ƒ /api/waste-banks/near                     172 B         103 kB
├ ○ /classify                                  7 kB         243 kB
├ ƒ /dashboard                               111 kB         217 kB
├ ○ /dashboard/camera                       3.54 kB         232 kB
├ ○ /dashboard/education                    12.1 kB         212 kB
├ ○ /dashboard/generate                        9 kB         199 kB
├ ○ /dashboard/history                      9.94 kB         230 kB
├ ○ /dashboard/upload                       5.01 kB         232 kB
├ ○ /dashboard/waste-banks                  9.99 kB         168 kB
├ ○ /education                              7.88 kB         170 kB
├ ƒ /education/[slug]                       3.41 kB         132 kB
├ ○ /faq                                    4.77 kB         161 kB
├ ○ /map                                    8.24 kB         148 kB
├ ○ /privacy                                3.84 kB         157 kB
├ ○ /sitemap-ui                              3.7 kB         160 kB
├ ○ /sitemap.xml                              172 B         103 kB
└ ○ /terms                                  3.13 kB         156 kB
+ First Load JS shared by all                103 kB
  ├ chunks/4bd1b696-cc729d47eba2cee4.js     54.1 kB
  ├ chunks/5881-bd7cc5b0b785adf6.js         46.2 kB
  └ other shared chunks (total)             2.44 kB
ƒ Middleware                                79.3 kB
```

Baseline observations for later comparison (Step 10 performance phase):

- Heaviest first-load routes: `/classify` **243 kB**, `/dashboard/camera` + `/dashboard/upload` **232 kB**, `/dashboard/history` 230 kB, `/dashboard` 217 kB.
- All API routes and `sitemap.xml` share the 103 kB baseline.
- `ƒ Middleware` bundle: **79.3 kB** (Clerk).
- `/dashboard` is dynamic (`ƒ`); other dashboard pages and public pages are static (`○`); `/education/[slug]` is dynamic as expected.

## Warnings observed (non-blocking, all runs)

| Warning | Source |
|---|---|
| `[baseline-browser-mapping] data over two months old` | tooling |
| `Browserslist: caniuse-lite is 11 months old` | tooling |
| `(node:…) [DEP0205] module.register() is deprecated` | Node 26 + tooling |
| `webpack.cache… Serializing big strings (175kiB)` | webpack cache |
| `[pwa] Custom runtimeCaching array found, using it instead of the default one` | next-pwa (informational) |

None affect correctness; recorded for completeness.

---

## Generated-file changes caused by baseline runs

| File | Change | Handling |
|---|---|---|
| `public/sw.js` | **Regenerated** by every build (3 runs); differs from committed HEAD and from the pre-baseline backup in build chunk hashes only — config/routes identical | Backup preserved at `/tmp/opencode/sw.js.pre-baseline`; regenerated output kept in tree (not reverted); to be untracked + gitignored in Step 3 |
| `public/workbox-c18c662b.js` | **Unchanged** (identical hash → same filename/content produced by builds; `git status` clean for this file) | — |
| `bun.lock` | **Unchanged by baseline** — still the user's pre-existing modification (next 15.4.7 → 15.4.8 lockfile sync) | Preserved; commit only with approval in Step 3 |
| `.next/**` | Regenerated (gitignored) | — |
| `tsconfig.tsbuildinfo` | Created by `bunx tsc --noEmit` (1.1 MB, gitignored via `*.tsbuildinfo`) | — |
| `docs/` | New untracked directory with the two Step 1–2 deliverables | Will be committed with docs step |

### Final `git status --short`

```
 M bun.lock
 M public/sw.js
?? docs/
```

`git diff --stat`: `bun.lock | 33 +++/---`, `public/sw.js | 2 +-` — same shape as before the baseline; no unexpected modifications.

---

## Notes for later phases

1. **Local build verification** in Steps 3+ needs env. Options (ask before creating): a gitignored `.env.local` with the user's real `DATABASE_URL` + Clerk keys, or ephemeral inline placeholders as used here. **No env file was created in this phase.**
2. Lint hardening (global ignores) remains scheduled for Step 3 even though the gate is currently green.
3. Baseline bundle figures above become the "before" column for the Step 10 performance report.
4. PWA could not be runtime-verified in this phase (needs a server + env); the SW artifact and its routes were audited statically in `docs/modernization-audit.md`.

---

_Facts in this document come from the commands and logs listed above. The two supplementary builds are explicitly labeled diagnostics; they are not part of the official baseline result._
