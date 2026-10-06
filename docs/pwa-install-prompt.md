# Daurtica — PWA Install Prompt & Installation UX (Phase 7)

> **Type:** Phase 7 record — installability detection, install prompt UX, dismissal memory, installed-state handling
> **Date:** 2026-10-06
> **Branch:** `chore/modernize-pwa` (no commits made — reserved for the later commit phase)
> **Scope:** install prompt only. No SW update lifecycle, XSS work, performance work, or manifest changes.
> **Related docs:** `docs/pwa-cache-strategy.md` (Phase 5), `docs/pwa-offline.md` (Phase 6), `docs/modernization-manifest.md`

---

## 1. Install prompt architecture

| Piece | Value |
|---|---|
| Hook | `src/hooks/use-install-prompt.ts` — all browser/install state |
| UI component | `src/components/pwa-install-button.tsx` — presentational control (two variants) |
| Consumer | `src/components/navbar.tsx` — one hook instance, two placements |
| Event source | `beforeinstallprompt` (deferred), `appinstalled` |
| Dismissal storage | `localStorage["daurtica:pwa-install-dismissed"]` = `{"dismissedAt": <epoch ms>}` |
| Installed detection | `matchMedia("(display-mode: standalone)")` + `navigator.standalone` (Safari/iOS) |
| Dependencies | **none added** (no PWA/install-prompt library, no UI library, no state library) |

The hook exposes a small typed interface:

```ts
{
  canInstall: boolean;      // deferred event available && !installed && !dismissed
  isInstalled: boolean;     // standalone display mode, navigator.standalone, appinstalled, or accepted
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
  dismissInstall: () => void; // hides CTA + persists dismissal without calling prompt()
}
```

`canInstall` is **derived**, never latched: it becomes `false` the moment the deferred event is
consumed, the app is installed, or a dismissal is remembered.

### State flow

```text
beforeinstallprompt
        ↓
 deferred event
        ↓
  canInstall
        ↓
  Install CTA
     /      \
 dismiss    install
    ↓          ↓
 storage     prompt()
                ↓
          appinstalled
                ↓
         isInstalled=true
```

## 2. `beforeinstallprompt` handling

`BeforeInstallPromptEvent` is not part of TypeScript's DOM lib, so the hook defines the smallest
local contract needed (`prompt()` + `userChoice`) and an explicit type guard — **no `any`, no global
DOM type augmentation**:

```ts
interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt: () => Promise<void>;
}
function isBeforeInstallPromptEvent(event: Event): event is BeforeInstallPromptEvent { … }
```

Lifecycle:

1. On mount (in `useEffect`), the hook subscribes to `window` `beforeinstallprompt` and `appinstalled`.
2. A well-formed event triggers `event.preventDefault()` (suppresses the browser mini-infobar so the
   Daurtica CTA controls timing), is stored in a ref, and sets `hasDeferredPrompt = true`.
3. A malformed event (no `prompt`/`userChoice`) is ignored by the type guard — verified in-browser.
4. `promptInstall()` reads the ref, **clears it and hides the CTA before calling `prompt()`**, then
   awaits `prompt()` and `userChoice`. One event can therefore never be prompted twice.
5. Events are never replayed: the ref is released on consumption, dismissal, installation, and on
   `prompt()` rejection.

## 3. `appinstalled` handling

On `appinstalled` the hook releases any deferred event, sets `isInstalled = true`, clears the
dismissal key, and hides the CTA. No analytics, no dependency, no further prompt. The accepted
`userChoice` path is treated the same way defensively (some browsers do not fire `appinstalled`),
so an accepted install can never leave the CTA visible.

## 4. Installed-state detection

Detection runs **after mount only** (never during SSR):

- `window.matchMedia("(display-mode: standalone)").matches` — Chromium, Edge, Safari (iOS 13+).
- `navigator.standalone === true` — Safari/iOS home-screen apps. Accessed through a local optional
  type (`Navigator & { readonly standalone?: boolean }`), never assumed to exist.
- A `matchMedia` `change` listener keeps the state fresh if display-mode changes without reload.
- `appinstalled` and an accepted `userChoice` also set installed state.

All detection is wrapped in `try/catch`; a browser without `matchMedia` simply reports “not
installed” and never throws.

## 5. Dismissal behavior

- **Policy: permanent dismissal** (the simplest reasonable behavior). The presence of the
  localStorage key hides the CTA; the stored `dismissedAt` timestamp exists so a cooldown can be
  introduced later without a format migration. See `persistDismissal()` in the hook.
- Dismissal is persisted in two cases:
  1. `dismissInstall()` (programmatic/UI dismissal — available in the hook API);
  2. the user dismisses the **native browser prompt** (`userChoice.outcome === "dismissed"`).
- Dismissal is cleared on `appinstalled` (and on an accepted outcome) — an installed app has no
  pending install decision.
- No dismissal state is ever sent to the server; no sensitive data is stored.

## 6. localStorage key

| Item | Value |
|---|---|
| Key | `daurtica:pwa-install-dismissed` |
| Value | `{"dismissedAt": 1791286927953}` (epoch milliseconds) |
| Written by | `use-install-prompt.ts` (`persistDismissal`) |
| Read | after mount only; `try/catch` for private mode / blocked storage |
| Cleared | `appinstalled`, accepted outcome, or the browser clearing site data |

## 7. Desktop UX

- Placement: existing navbar right action area, before the theme toggle — **no redesign, no banner**.
- Control: small ghost `<Button size="sm">` with a decorative `Download` icon + visible label
  **“Install Aplikasi”** (Indonesian, matching the app UI).
- Visibility: only while `canInstall` is true, and only at `xl` (≥ 1280 px). At 768–1279 px the
  navbar right section would overlap the main menu if the CTA were shown (the CTA adds ~154 px;
  measured menu/right-section collision), so it is hidden there rather than redesigning the
  navbar. Below 768 px the control lives in the mobile menu. The browser's own install affordance
  (address-bar icon) remains available at all widths.

## 8. Mobile UX

- Entry: a full-width menu item inside the existing slide-out sidebar (`PwaInstallButton
  variant="menu"`), rendered only while `canInstall` is true — never force-inserted into the
  viewport.
- Touch target: `px-4 py-3` → measured 271 × 50 px (≥ 44 px).
- Behavior: starts the prompt flow and closes the menu so the browser prompt is unobstructed.
- Same styling language as the existing nav items (rounded, hover, focus ring).

## 9. Unsupported-browser behavior

If `beforeinstallprompt` is unavailable, `canInstall` stays `false` and **nothing is rendered**:
no “browser not supported” text, no error toast, no broken button, no console output. This covers
Firefox desktop, Safari desktop, older browsers, and any environment where the browser withholds
the event.

## 10. Safari / iOS limitation

- iOS Safari never fires `beforeinstallprompt`; no programmatic install prompt is possible. The
  project therefore shows **nothing** on iOS (silent unsupported path) — no iOS instruction modal
  was added (explicitly optional in Phase 7).
- Opening the app from an iOS home-screen shortcut sets `navigator.standalone === true` (and
  standalone display-mode); the hook detects this and hides the CTA.
- `navigator.standalone` is accessed optionally and defensively — Chrome/Firefox (where it does not
  exist) are unaffected.
- If a future phase wants iOS “Add to Home Screen” instructions, it should reuse this hook's
  `isInstalled`/`canInstall` state rather than adding a second detection path.

## 11. Accessibility

- Real `<button type="button">` elements — natively keyboard focusable (verified `tabIndex 0`,
  DOM focus, and activation with a trusted `Enter` key).
- Visible text label “Install Aplikasi” is the accessible name in both variants; the icon is
  `aria-hidden="true"` and is never the only label.
- Focus state comes from the design-system ring (`focus-visible:ring-*`); the mobile item declares
  the same ring explicitly.
- Touch target ≥ 44 px; no focus trap; click target verified with a trusted CDP mouse event.
- The CTA simply unmounts after the prompt is consumed — there is no lingering disabled state or
  focus trap.

## 12. Browser verification

Environment: headless Chromium **Chrome/154.0.8037.0** (Playwright build 1244 binary) driven over
CDP on a fresh profile, production build (`bun run build` → `bun run start`), plus a second Chrome
**`--app`** instance where `display-mode` is genuinely `standalone`. Equipment:
`/tmp/opencode/cdp-install-test.mjs`, `cdp-app-standalone-test.mjs`, `cdp-layout-test.mjs`.

| Test | Type | Result |
|---|---|---|
| Manifest link + SW active/controlling; no CTA before any event | real | ✅ |
| Native `beforeinstallprompt` observed and produced the CTA | **real** (Chromium flag `--bypass-app-banner-engagement-checks`; the event genuinely fired) | ✅ |
| Malformed event ignored (state unchanged, no crash) | synthetic | ✅ |
| `preventDefault()` called on the deferred event | synthetic (cancelable event) | ✅ |
| CTA a11y: button type, label, focus, keyboard Enter activation | real browser DOM + trusted CDP input | ✅ |
| Mobile menu entry, touch target, focus | real (390×844 emulation) | ✅ |
| Dismissal: prompt dismissed → localStorage key → reload hides CTA, new event cannot re-show | synthetic events | ✅ |
| Acceptance: event consumed, `isInstalled`, new event cannot re-show CTA, no dismissal stored | synthetic events | ✅ |
| `appinstalled`: CTA hidden, no re-show, `prompt()` never called | synthetic event (no real install available headless) | ✅ |
| Standalone display-mode: **real** `--app` window (`matchMedia === true`) keeps CTA hidden even with an event | real window + synthetic event | ✅ |
| iOS `navigator.standalone === true` branch keeps CTA hidden | synthetic (test-only `Navigator.prototype` patch) | ✅ |
| `prompt()` rejection (`NotAllowedError` from an untrusted click) handled silently, event consumed | **real** native event | ✅ |
| `prompt()` with a trusted gesture invoked exactly once, no repeat, CTA hidden | **real** native event + trusted CDP input | ✅ |
| Layout: no navbar overlap at any width; CTA only rendered where clickable (hit-test) | real browser at 800/1024/1200/1280/1440/1920/390 px | ✅ |

Results: **57/57** main-suite assertions, **17/17** layout assertions, **5/5** standalone-app
assertions; **0 page exceptions** (only the pre-existing Clerk development-keys warning).

Headless limitation: the real `prompt()` resolved but `userChoice` stayed pending because headless
Chromium has no install dialog, and a real `appinstalled` cannot be generated. The accepted /
dismissed / appinstalled branches were therefore verified with synthetic events (clearly labeled
above) — the same code paths the browser invokes.

## 13. Known limitations

1. **Dismissal is permanent** until site data is cleared (documented policy; `dismissedAt` retained
   for a future cooldown).
2. **768–1279 px has no navbar CTA** — a deliberate choice to avoid overlapping the existing menu
   (the navbar itself is already crowded at ≤ ~900 px, pre-existing and untouched). Browser install
   UI remains available.
3. **Headless cannot complete a real installation**, so `appinstalled`/standalone were verified via
   synthetic events and a real `--app` window respectively.
4. **`beforeinstallprompt` subscription happens in a mount effect.** If the browser fired the event
   before hydration (not observed in practice), that event is missed; a later navigation/visit
   refires it.
5. **Dismissal is not synced across tabs** (no `storage` event listener) — a second open tab may
   still offer the CTA until reload. Low impact.
6. **One new lint warning** (`react-hooks/set-state-in-effect` on the client-only initial state
   sync) — the same pattern class this repo's ESLint config explicitly keeps as a visible warning
   (21 pre-existing → 22, 0 errors).
7. **No analytics/telemetry** for installs (explicitly out of scope).

## 14. Future improvements

- Cooldown-based dismissal using the stored `dismissedAt` timestamp (e.g., re-offer after 14 days).
- Cross-tab dismissal sync via the `storage` event.
- Optional iOS “Add to Home Screen” instruction sheet for Safari, reusing this hook's state.
- Earlier `beforeinstallprompt` capture via a tiny inline bootstrap script (only if a real miss is
  ever observed).
- SW update lifecycle (`controllerchange`, update notice) — still deferred to a later phase.
- XSS remediation and performance work — later phases.

## 15. Regression status (Phases 5–6)

- `/~offline` fallback still works (offline navigation to a never-visited `/privacy` produced the
  fallback at the requested URL).
- Service worker: still 15 runtime routes, 131 precache entries, `importScripts` fallback,
  `skipWaiting()` + `clientsClaim()` — byte-level policy unchanged.
- No `/dashboard`, `/api/classification`, `/api/education/personal`, or `/api/inngest` entry in
  Cache Storage after the install tests.
- `/`, `/classify`, `/education`, `/faq`, `/~offline`, `/manifest.webmanifest`, `/sw.js`,
  `/api/waste-banks?limit=1` all return 200.
- `bun audit`: 121 pre-existing advisories (2 critical / 71 high / 44 moderate / 4 low) — unchanged
  baseline, not remediated (out of scope).
- Versions: Next 16.3.8 · React 19.2.8 · Clerk 7.9.11 · `@ducanh2912/next-pwa` 10.2.9 ·
  Inngest 3.54.2 — **no dependency changes**.

## 16. Files

| File | Change |
|---|---|
| `src/hooks/use-install-prompt.ts` | new — install state machine, event handling, dismissal memory |
| `src/components/pwa-install-button.tsx` | new — presentational navbar/menu control |
| `src/components/navbar.tsx` | minimal — one hook call + desktop and mobile placements |
| `docs/pwa-install-prompt.md` | new — this document |

No manifest values were changed (audit found no installability problem): `/manifest.webmanifest`
with `display: standalone`, `start_url: /`, `scope: /`, `id: /`, 192/512 icons (`any` + `maskable`),
theme `#16a34a`, background `#ffffff`. No generated artifact (`public/sw.js`,
`public/workbox-*.js`, `public/fallback-*.js`) was edited; no commits were made.
