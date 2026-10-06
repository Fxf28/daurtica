# Daurtica — Service Worker Update Lifecycle & Update UX (Phase 8)

> **Type:** Phase 8 record — SW update detection, update banner, controlled reload, loop protection
> **Date:** 2026-10-06
> **Branch:** `chore/modernize-pwa` (no commits made — reserved for the later commit phase)
> **Scope:** SW update lifecycle only. No XSS work, performance work, cache-strategy change, offline change, install-prompt change, dependency change, or generated-artifact edit.
> **Related docs:** `docs/pwa-cache-strategy.md` (Phase 5), `docs/pwa-offline.md` (Phase 6), `docs/pwa-install-prompt.md` (Phase 7)

---

## 1. Architecture

| Piece | Value |
|---|---|
| Hook | `src/hooks/use-service-worker-update.ts` — entire update state machine |
| UI component | `src/components/pwa-update-banner.tsx` — presentational, non-modal banner |
| Consumer | `src/app/layout.tsx` — rendered once at root (after `{children}`, before `Toaster`) |
| Registration | **plugin-managed** (`@ducanh2912/next-pwa`, `register: true`); Phase 8 never calls `register()` |
| Detection APIs | `navigator.serviceWorker.getRegistration()`, `ready`, `updatefound`, worker `statechange`, `controllerchange` |
| Update trigger | `registration.update()` — once after discovery + on visible/focus, throttled 5 min |
| Reload | user-initiated only (`Perbarui sekarang`), single guarded `window.location.reload()` |
| Guard | in-memory refs + one-shot `sessionStorage["daurtica:pwa-update-reloaded"]` marker |
| Dependencies | **none added** |

State model (typed, no `any`):

```ts
type ServiceWorkerUpdateState =
  | "unsupported"      // no navigator.serviceWorker
  | "checking"         // initial, SSR-safe default
  | "up-to-date"       // registration discovered, nothing pending
  | "update-available" // a new worker is installed/activated
  | "updating";        // user pressed update, reload sequence in progress

interface UseServiceWorkerUpdateResult {
  state: ServiceWorkerUpdateState;
  updateAvailable: boolean; // state === "update-available"
  dismissed: boolean;       // user pressed "Nanti" for this page session
  update: () => void;       // controlled update/reload flow
  dismiss: () => void;      // hide banner only
}
```

## 2. Registration audit (Phase 8A) — how the plugin registers

Verified by reading the installed package (`node_modules/@ducanh2912/next-pwa/dist/sw-entry.js`), the
compiled client bundle (`.next/static/chunks/main-*.js`), and the generated `public/sw.js`:

1. `next.config.ts` passes `register: true`.
2. The plugin compiles `sw-entry` into the client entry. The built bundle contains literally:

   ```js
   if ("undefined" != typeof window && "serviceWorker" in navigator && "undefined" != typeof caches) {
     window.workbox = new Workbox(window.location.origin + "/sw.js", { scope: "/" });
     window.workbox.register();
     ...
   }
   ```

3. `window.workbox.register()` calls `navigator.serviceWorker.register("/sw.js", { scope: "/" })`
   during client-bundle evaluation — **before** React hydration.
4. Generated `public/sw.js` contains `self.skipWaiting()`, `e.clientsClaim()`,
   `precacheAndRoute(...)`, `importScripts("/fallback-<hash>.js")` and 15 runtime routes.

**Consequence:** Phase 8 must NOT register a second worker. The hook obtains the existing
registration via `navigator.serviceWorker.getRegistration()` (with a `navigator.serviceWorker.ready`
fallback for the first-visit race where registration is still being created) and attaches to it.
No `register()` call exists anywhere in Phase 8 code. `window.workbox` itself is intentionally not
used, so Phase 8 does not depend on plugin-internal objects.

## 3. Update detection

```
browser / manual registration.update()
        ↓
registration.updatefound
        ↓
registration.installing (new worker)
        ↓ statechange: installed → activating → activated
new worker activates (skipWaiting) & claims clients (clientsClaim)
        ↓
controllerchange
        ↓
update-available → banner
```

- `updatefound` → `registration.installing` worker is tracked with a `statechange` listener.
  `installed`, `activating`, and `activated` all mean a new version is ready.
- A worker already `installing`/`waiting` at discovery time (browser found the update during
  navigation before mount) is picked up too.
- `controllerchange` after a prior controller is an independent, backstop signal.
- **First install is not an update.** `trackInstallingWorker()` ignores workers when
  `registration.active === null`, and the first `controllerchange` (initial `clientsClaim` on a
  first visit, where `controller` was `null` at mount) is ignored. This is what prevents the banner
  and reload on normal first load.

## 4. How `skipWaiting` shapes the design

The generated worker calls `self.skipWaiting()` at script evaluation and `clientsClaim()` on
activate. Therefore:

- a new worker **does not stay in the classic `waiting` state** — it activates as soon as precache
  finishes and immediately claims existing pages (`controllerchange`);
- **no `waiting.postMessage({ type: "SKIP_WAITING" })` flow exists** in Phase 8. Inventing one would
  be dead code that does not match the generated lifecycle. (A `waiting` worker found at discovery
  is still recognized defensively, but it is expected to be transient or unreachable.)
- "Update now" means: the new worker has already (or is about to) take control → reload once to
  apply the new HTML/chunks. There is nothing to "activate" from the page.

## 5. `controllerchange` handling

`navigator.serviceWorker.addEventListener("controllerchange", ...)` is attached in the mount effect.
On each event the hook:

1. reads the new controller and compares with the previously known controller;
2. if there was **no** previous controller (first claim / first visit) → ignore (no banner, no reload);
3. otherwise records that a new controller was seen;
4. if the user already pressed **Perbarui sekarang** and the hook is waiting for this event →
   perform the single guarded reload;
5. otherwise → mark `update-available` (show the banner, **no automatic reload**).

`controllerchange → window.location.reload()` without guards is explicitly not implemented.

## 6. Reload-loop protection

Three independent guards:

| Guard | Purpose |
|---|---|
| First-claim rule | `lastControllerRef` is `null` on first visit → first `controllerchange` never reloads |
| No auto-reload rule | ordinary `controllerchange` only shows the banner; reload happens only from the user's `update()` action (or a controllerchange awaited *after* that action) |
| `reloadGuardedRef` (in-memory) | idempotent per page: two triggers for one click cannot reload twice |
| `sessionStorage["daurtica:pwa-update-reloaded"]` | one-shot marker written immediately before the reload; **consumed and removed at the next mount** (the reset point), so a future, independent update can reload normally |

`update()` also handles the race where the controller has not changed yet: it waits for
`controllerchange` and, after 5 s without one, **returns to `update-available` without reloading** —
a blind timeout reload could loop without ever applying the update. Given `skipWaiting` +
`clientsClaim`, the normal path is: controller already changed → immediate guarded reload.

Scenario matrix (verified in §10):

| Scenario | Banner | Auto reload |
|---|---|---|
| First visit / first install (`controllerchange` #1) | no | no |
| Normal load, no deployment | no | no |
| New SW deployed while page open (`controllerchange` #2) | yes | no |
| User presses "Perbarui sekarang" | hides | exactly one |
| User presses "Nanti" | hides | no |
| Same update after dismissal (page session) | stays hidden | no |

## 7. `registration.update()` strategy

- **Once after registration discovery** (after `updatefound` listeners are attached, so nothing is
  missed). It does not run in a loop.
- **On `visibilitychange` (visible) and window `focus`**, throttled to at most once per
  **5 minutes** (`UPDATE_CHECK_THROTTLE_MS`). No polling, no timers, no interval.
- Errors are swallowed (`try/catch` around `await registration.update()`); an offline or failing
  check never changes UI state and never throws. A failed background check simply leaves the state
  as-is and will be retried after the throttle window.
- Phase 7's install prompt and Phase 6's offline behavior are untouched by these calls.

## 8. Update UX

- **Placement:** root layout (`src/app/layout.tsx`), rendered after `{children}` so it is available
  on every route (public, dashboard, offline) and appears last in tab order; `position: fixed`,
  bottom-center on mobile (`inset-x-4`), bottom-right on `sm+`, above the navbar (`z-[1100]`),
  safe-area aware. No navbar modification, no coupling with the Phase 7 install CTA.
- **Copy (Indonesian):**
  - Title: **“Versi baru tersedia”**
  - Body: **“Daurtica memiliki pembaruan baru. Muat ulang untuk menggunakan versi terbaru.”**
  - Actions: **“Perbarui sekarang”** (primary) and **“Nanti”** (ghost) + a close icon button with
    `aria-label="Tutup notifikasi pembaruan"`.
- **No hydration mismatch:** the component returns `null` until the state becomes
  `update-available`; server HTML and first client render are identical (`null`).
- **No first-load appearance:** first install and normal loads never reach `update-available`.
- **Unsupported browsers:** `state === "unsupported"` → nothing rendered, no errors.

## 9. Dismissal behavior ("Nanti")

- `dismiss()` only hides the banner; it does **not** cancel/abort the installed service worker,
  does **not** call `unregister()`, does **not** delete caches, and does **not** write any
  preference to storage.
- Dismissal lasts for the current page session (until the next full document load). A new update
  detected while the page is running does not force the dismissed banner back; the state remains
  `update-available` internally and the reload is still applied on the next natural load.
- No notification-preference system was introduced.

## 10. Accessibility

- Semantics: `role="status"` + `aria-live="polite"` so the appearance is announced politely;
  actions are native `<button type="button">` elements inside the status region.
- Keyboard: buttons are focusable (`tabIndex 0`), activated by Enter/Space natively, and use the
  design-system focus ring (`focus-visible:ring-*`). The close control has an explicit `aria-label`.
- Focus behavior: the banner does not steal focus (no auto-focus) and does not trap focus; it is a
  small non-modal element, so the rest of the app stays fully usable.
- Layout: bottom banner on mobile, right-side card on desktop; action targets ≥ 24 px (WCAG 2.5.8 AA)
  and close control 28 × 28 px.

## 11. Browser verification

Environment: production build (`bun run build` → `bun run start`), headless Chromium
**Chrome/154.0.8037.0** (Playwright build 1244) over CDP, fresh profiles.
Scripts (outside the repo): `/tmp/opencode/cdp-phase8-live-test.mjs`,
`cdp-phase8-synthetic-update-test.mjs`, `cdp-phase8-unsupported-test.mjs`;
Phase 7 rerun `cdp-install-test.mjs`.

### 11.1 Real browser tests — `30/30` assertions

| Area | Verified |
|---|---|
| Registration | `navigator.serviceWorker` supported; plugin registration found, `scope = /`, active worker `activated`, page controlled |
| Update-check path | instrumented **real** `registration.update()` called once after discovery (`updateCalls = 1`); hook attached an `updatefound` listener; first `controllerchange` observed (`clientsClaim`) |
| Loop/false-positive | no banner, no reload over 6.5 s idle (timeOrigin stable); no banner from background checks |
| Lifecycle events | (clock-offset synthetic) `visibilitychange` and `focus` after throttle each ran a **real** `update()` check |
| Cache Storage | no `/dashboard`, `/api/classification`, `/api/inngest`, `/api/education/personal` entries; cached API paths only `/api/education/public`, `/api/waste-banks`; no `/privacy`/`/faq` documents |
| Offline | server shutdown = connection refused; `/privacy` (never visited) rendered `/~offline` copy at the requested URL; `/api/waste-banks?limit=1` served from NetworkFirst cache (200 JSON, not HTML); `/api/classification/history` and `/api/inngest` failed without offline HTML; `/dashboard` got the browser error page, not the fallback |
| Recovery | server restarted; `/privacy` loaded the real page; SW still controlling |
| Console | 0 relevant page errors/exceptions |

### 11.2 Synthetic-controlled update lifecycle — `31/31` assertions

**What is synthetic:** the "new deployment" is served by a local in-process proxy on :3000 that
appends a version marker to the real `public/sw.js` bytes (file only **read**, never modified);
Next.js ran on :3001. Everything else is a real browser SW lifecycle.

| Area | Verified |
|---|---|
| First install (`v1`) | activated, controlling, no banner, no reload in 6 s |
| Deployment `v2` | `registration.update()` → `updatefound` → install → `skipWaiting` → activate → `clientsClaim` → `controllerchange` #2; banner appeared with exact copy; **no automatic reload** |
| A11y | native `button type=button`, visible labels, aria-labeled close, `tabIndex 0`, targets ≥ 24 px; programmatic focus; **trusted CDP Enter** activated the button (no fallback needed) |
| Controlled update | exactly one reload (timeOrigin changed once); `sessionStorage` marker written before reload and consumed on the new document; banner gone; SW controlling; mount check ran; stable over 6.5 s (no loop) |
| Dismiss (`v3`) | banner, trusted Enter on "Nanti" → hidden; no reload; banner stayed hidden for the same update; SW still registered/controlling; caches intact |

### 11.3 Unsupported / no Service Worker — `9/9` assertions

Synthetic platform patch (`delete Navigator.prototype.serviceWorker` before app scripts):
app rendered normally, no banner, no reload loop over 5 s, no hydration errors, no relevant
console errors. Patch validity was asserted first (`delete` succeeded).

### 11.4 Known browser/headless limitations

- A **real deployment** (new build on the server) was not performed; the update was produced by a
  byte-identical worker plus a marker via proxy. Real SW machinery, synthetic version bytes.
- Headless Chromium cannot complete a real install prompt flow (unchanged Phase 7 limitation).
- `visibilitychange`/`focus` checks were exercised with a synthetic `Date.now` offset to pass the
  5-minute throttle; the `update()` call itself was real.
- The `--app` standalone window (Phase 7 test 6a) requires a companion Chrome on :9223; launched
  for the regression run.

## 12. Static validation

| Check | Result |
|---|---|
| `bun run lint` | ✅ 0 errors, **23 warnings** (22 pre-existing + 1 new `react-hooks/set-state-in-effect` on the `unsupported` branch — the same warning class the repo keeps visible by policy) |
| `bunx tsc --noEmit` | ✅ no errors |
| `bun run build` (`next build --webpack`) | ✅ 29/29 static pages; PWA log: SW `/sw.js`, scope `/`, document fallback `/~offline`, custom `runtimeCaching` used |
| `bun audit` | 121 pre-existing advisories (2 critical / 71 high / 44 moderate / 4 low) — unchanged baseline, not remediated |
| Served `/sw.js` | byte-identical to `public/sw.js` (15,889 bytes); `self.skipWaiting()`, `clientsClaim()`, `precacheAndRoute`, `importScripts("/fallback-…")`, `/~offline`, 5 `daurtica-*` caches; **15 routes** (3 NetworkFirst, 9 NetworkOnly, 1 CacheFirst, 2 SWR) |
| Precache | 132 entries (Phase 6 documented 131; the layout chunk graph changed because the banner is rendered at root, so one extra build asset is precached — precache policy itself is unchanged) |
| Runtime smoke | `/`, `/classify`, `/education`, `/faq`, `/~offline`, `/manifest.webmanifest` (standalone, scope `/`) and `/sw.js` return 200; `/api/waste-banks?limit=1` returns 200 JSON |

## 13. Regression status

- **Phase 5 (cache strategy):** no route, handler, cache name, or ordering change. The 15-route
  table in `public/sw.js` is unchanged; mutations remain guarded NetworkOnly; dashboard/Inngest/API
  catch-alls remain NetworkOnly; approved public endpoints remain NetworkFirst.
- **Phase 6 (offline):** `/~offline` precache + document fallback verified again end-to-end
  (fallback at the requested URL, private routes without fallback, APIs never get offline HTML).
- **Phase 7 (install prompt):** full suite rerun — **57/57** assertions (CTA conditions, dismissal
  memory, `beforeinstallprompt` real/synthetic handling, standalone display mode, offline smoke).
  The update banner is a separate component/hook; the install CTA state was not touched.
- Generated artifacts (`public/sw.js`, `public/workbox-*.js`, `public/fallback-*.js`) are produced
  by `@ducanh2912/next-pwa` at build time and are **never manually edited** (and remain gitignored).

## 14. Limitations

1. **No version comparison.** The banner reacts to controller/worker changes, not to a build ID, so
   if a deployment is discovered during the very first page load of a session the banner may appear
   even though the loaded page already reflects the new build. Reloading is harmless.
2. **Pre-hydration controller changes are invisible.** If a new worker claims the page before the
   hook mounts, there is no `controllerchange` to observe; the running page may be a mix of old
   chunks until the next navigation. Same limitation as `workbox-window`-style detection.
3. **Dismissal is per page session** (no persistence, no cross-tab sync), and a newer update detected
   after a dismissal reuses the hidden banner until the next full load.
4. **`waiting` worker path is defensive only.** With `skipWaiting` it is not expected to persist; if
   it ever did, the hook would treat the update as available and best-effort reload once.
5. The visibility/focus check is throttled to 5 minutes; a deployment that happens within that
   window is picked up on the next check, on reload, or via normal navigation.
6. Headless verification cannot perform a true production redeploy; see §11.4.

## 15. Deferred work

- XSS remediation (`dangerouslySetInnerHTML` in the education renderer) — later phase.
- Performance/Lighthouse optimization, image/bundle work — later phase.
- Final QA/documentation pass and the actual commit (branch currently uncommitted by design).
- Optional future: build-ID comparison to eliminate the §14.1 false-positive banner; cross-tab
  dismissal/update sync via `storage`/`BroadcastChannel`; configurable dismissal cooldown.
- Known limitation inherited from Phase 5: legacy runtime caches are not actively deleted.

## 16. Files

| File | Change |
|---|---|
| `src/hooks/use-service-worker-update.ts` | **new** — update state machine, discovery, detection, guarded reload, `registration.update()` strategy |
| `src/components/pwa-update-banner.tsx` | **new** — accessible non-modal update banner |
| `src/app/layout.tsx` | minimal — import + render `<PwaUpdateBanner />` at root |
| `docs/pwa-update-lifecycle.md` | **new** — this document |

No other source file was modified. No dependency, manifest, database, API, auth, Inngest, or AI
behavior was changed. No commit was created.
