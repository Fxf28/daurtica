# Inngest Security Patch — CVE-2026-42047

> **Type:** Targeted security patch (pre-Phase-5), minimum safe v3 upgrade
> **Date:** 2026-10-06
> **Branch:** `chore/modernize-pwa` (no commits made)
> **Scope:** `inngest` package upgrade + verification. No PWA, auth, database, or Next.js changes.

---

## Advisory

| Field | Value |
|---|---|
| CVE | **CVE-2026-42047** |
| GitHub Advisory | GHSA-2jf5-6wwv-vhxx |
| Severity | High |
| Summary | Inngest TypeScript SDK allows unauthenticated remote attackers to exfiltrate environment variables from the host process via the `serve()` HTTP handler. `serve()` implements GET/POST/PUT; requests using PATCH/OPTIONS/DELETE fell through to a generic handler that returned diagnostic information. |
| Affected | `inngest >= 3.22.0 < 3.54.0` (3.22.0 through 3.53.1) |
| Patched | **`inngest@3.54.0`** (minimum) |
| v4 | Not affected (migration intentionally deferred — see below) |
| Advisory references | [Inngest blog](https://www.inngest.com/blog/cve-2026-42047) · [GHSA-2jf5-6wwv-vhxx](https://github.com/advisories/GHSA-2jf5-6wwv-vhxx) · NVD/CVE.org |

Independently verified from multiple sources before patching (Inngest blog, GitHub Advisory Database, NVD). The Inngest blog additionally states: *"Developers explicitly exposing only the 3 HTTP methods leveraged by Inngest were not vulnerable."*

## Versions

| | Version |
|---|---|
| Previous installed | **`inngest@3.45.1`** (affected) — `package.json` `^3.45.1`, `bun.lock` resolved `3.45.1` |
| Previous installed in repo since | commit `99edb8f` (2025-11-19), introduced as `^3.45.1`; unchanged until this patch |
| Upgraded to | **`inngest@3.54.2`** (latest v3; ≥ 3.54.0 required) — `package.json` now `^3.54.0` |
| Upgrade command | `bun add inngest@^3.54.0` (no other dependencies added; v4 not pulled — `latest` dist-tag is v4 and was intentionally avoided) |

Lockfile scope verification (diff against pre-upgrade backup `/tmp/opencode/bun.lock.pre-inngest`):

- Only `inngest` and its dependency subtree changed: OpenTelemetry package consolidation (0.57.x/1.30.x → 0.207.x/2.2.x), `import-in-the-middle` 1.x → 2.x, removal of `shimmer`/`@types/shimmer`, addition of `@traceloop/*` (new inngest 3.54 dependency).
- Every direct application dependency (next, react, @clerk/nextjs, drizzle-orm, @neondatabase/serverless, cloudinary, @tensorflow/tfjs, leaflet, recharts, framer-motion, zod, …) still present — key-level diff confirmed no unrelated package entries were added/removed.
- The pre-existing working-tree `bun.lock` modification (next 15.4.7 → 15.4.8 sync) is preserved; backup also at `/tmp/opencode/bun.lock.pre-inngest`.

## Route security assessment

`src/app/api/inngest/route.ts` (unchanged by this patch):

```ts
export const { GET, POST, PUT } = serve({ client: inngest, functions: [generateEducationContentFunction] });
```

- **Source level:** exports exactly `GET`, `POST`, `PUT` — no `PATCH`, `DELETE`, `OPTIONS`, or catch-all handler. Unhandled methods are rejected by the Next.js App Router (405) and never reach `serve()`.
- **History:** git history shows this file has exported only `{ GET, POST, PUT }` since its introduction (commit `99edb8f`, 2025-11-19) — the pattern was never weakened.
- **Compiled level:** after a production build, the compiled route module's `userland` HTTP methods were introspected directly: **`GET, POST, PUT`** only.
- **Conclusion:** per the advisory's own workaround note, Daurtica's route was **already protected from this specific vulnerability** even on the affected `3.45.1`. The upgrade was still performed as defense-in-depth (framework/routing behavior can change; and future refactors could accidentally widen method exports).

## Verification results

| Check | Command | Result |
|---|---|---|
| Lint | `bun run lint` | ✅ PASS — `✔ No ESLint warnings or errors` |
| Typecheck | `bunx tsc --noEmit` | ✅ PASS — exit 0 (SDK API `serve()`/`Inngest` unchanged for our usage) |
| Build (normal, as-is env) | `bun run build` | ❌ FAIL — only the **known environment limitation** (`DATABASE_URL` missing; `.env` empty). Compilation itself succeeded (`✓ Compiled successfully in 43s`); log `/tmp/opencode/build-inngest-normal.txt` |
| Build (diagnostic, ephemeral placeholder env) | inline placeholders | ✅ SUCCESS — 28/28 pages, `/api/inngest` route present; log `/tmp/opencode/build-inngest-with-env.txt` |
| Compiled route methods | `node` introspection of `.next/server/app/api/inngest/route.js` | ✅ `userland: GET, POST, PUT` |
| Advisory re-check | `bun audit` | ✅ **CVE-2026-42047 / GHSA-2jf5-6wwv-vhxx is no longer flagged** for the installed version |
| Route diff | `git diff -- src/app/api/inngest/route.ts` | ✅ empty — no code changes needed |

### Other audit findings (pre-existing, out of scope)

`bun audit` reports 162 vulnerabilities across the repo (6 critical / 94 high / 56 moderate / 6 low), almost all pre-existing transitive/dev-tooling advisories (node-tar, webpack via next-pwa, uuid, grpc-js, protobufjs, OTel instrumentations, etc.). **18 dependency-path lines traverse the `inngest` subtree** — these are transitive advisories in packages inngest pulls in, not CVE-2026-42047.

⚠️ **Notable finding requiring a separate decision:** `next@15.4.8` (pinned, unchanged per constraints) is flagged by three advisories:

- `GHSA-mwv6-3258-q52c` (high) — DoS with Server Components, fixed in **15.4.9**
- `GHSA-w37m-7fhw-fmv9` (moderate) — Server Actions source code exposure, fixed in **15.4.9**
- `GHSA-8h8q-6873-q5fj` (high) — DoS with Server Components, fixed in **15.5.16**

Recommended: schedule a separate Next.js security patch (minimum 15.4.9; 15.5.27 is the latest 15.x) with full regression testing. Not performed here (Next.js version changes are explicitly out of scope for this task).

## Secret rotation recommendation

**Recommended — operator action required, not automated.** The repository used affected versions (`^3.45.1`, lock-resolved `3.45.1`) from 2025-11-19 onward, and the project targets a publicly reachable Vercel deployment. If any deployment running an affected version was publicly reachable, Inngest's guidance is to **rotate sensitive environment variables** — in particular Inngest signing/event keys (`INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY`) and any other secrets present in that environment (`DATABASE_URL`, `CLERK_SECRET_KEY`, Cloudinary credentials, `GOOGLE_API_KEY`, …).

No secrets were rotated, printed, or modified by this patch; `.env` was not touched.

## v4 migration

Intentionally **deferred**. The patch is a minimum safe v3 upgrade (`3.45.1 → 3.54.2`); no v4 migration, no API/route changes, no new dependencies.

## Files changed

| File | Change |
|---|---|
| `package.json` | `"inngest": "^3.45.1"` → `"^3.54.0"` (1 line) |
| `bun.lock` | inngest + transitive resolution updates only (verified scope above) |
| `src/app/api/inngest/route.ts` | **unchanged** |

Backups: `/tmp/opencode/package.json.pre-inngest`, `/tmp/opencode/bun.lock.pre-inngest`. No commits made.
