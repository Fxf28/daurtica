# XSS Remediation — Education Content Sanitization (Phase 9)

**Status:** PASS (see final Phase 9 report)
**Scope:** Stored-XSS remediation for the public education article renderer.
**Non-goals:** performance, UI redesign, database migration, API redesign, auth,
Clerk, Inngest, AI classification, PWA/cache/service-worker changes.

---

## 1. Original vulnerability

`src/app/(public)/education/[slug]/page.tsx` rendered public education article
content with `dangerouslySetInnerHTML`. The inline formatter built raw HTML
strings by regex replacement **without escaping the underlying text**:

```tsx
function renderInlineFormatting(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code class='…'>$1</code>");
}
// …
<p dangerouslySetInnerHTML={{ __html: renderInlineFormatting(para) }} />
```

Any HTML present in `education_public.content` was injected into the DOM as
markup. The Phase 1 audit recorded this as **R2 — HIGH: stored XSS in the
education article renderer** (`docs/modernization-audit.md` §3.6, §R2).

Exploit reality (browser behaviour):

- `<script>` inserted via `innerHTML` does **not** execute in modern browsers,
  but it still lands in the DOM (and would execute if ever re-parsed).
- Event-handler payloads (`<img src=x onerror=…>`, `<svg onload=…>`,
  `<div onclick=…>`), `javascript:` URLs, `<iframe>`, `<object>`, `<embed>`,
  and data-URL variants **do** execute/are dangerous.
- Because content is stored, exploitation persisted for every reader of the
  article — including unauthenticated visitors (published articles are public).

## 2. Affected renderer / path

Vulnerable file (pre-remediation): `src/app/(public)/education/[slug]/page.tsx`
— four `dangerouslySetInnerHTML` sinks: ordered-list `<li>`, unordered-list
`<li>`, `<blockquote>`, `<p>`.

Data flow (as found):

```
education_public.content (Postgres text, markdown-lite, unsanitized)
    ↓
GET /api/education/public/slug/[slug]      (returns raw content)
    ↓
src/lib/api/education-public.ts            (zod-validates shape, not HTML)
    ↓
src/app/(public)/education/[slug]/page.tsx (server component)
    ↓
parseContent() → renderInlineFormatting()  (raw HTML string, no escaping)
    ↓
dangerouslySetInnerHTML                    → DOM
```

Related paths audited and classified:

| Path | Rendering | Verdict |
|---|---|---|
| `education_public.content` (public article) | `dangerouslySetInnerHTML` (pre-fix) | **vulnerable → fixed** |
| `education_personal.generatedContent` (AI output) | `education-personal-item.tsx` uses React children only (`{paragraph}`, `{match[1]}`) | safe (no HTML sink) |
| `test-education-generate.tsx` preview | React text interpolation | safe |
| Admin list `education-public-article.tsx` | list API returns `content: ""`; title/tags as text | safe |
| `/education` list page | excerpt / `renderPlainTextPreview` as React text | safe |
| `layout.tsx` + `(public)/page.tsx` JSON-LD | `dangerouslySetInnerHTML` with **hard-coded static objects** | safe/static, out of scope |
| `/api/education/public` list | omits `content` deliberately | no sink |
| `/api/education/public/[id]`, `publish`, `slug` | return raw content JSON | no DOM sink; contract unchanged |

No `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval(`,
`new Function(` occurrences exist in `src/` (see §7 of the Phase 9 report).

## 3. Content format (content contract)

Public education content is authored as **markdown-lite plain text** through a
plain `<textarea>` (no rich-text editor, no WYSIWYG, no HTML mode). The parser
supports exactly:

- `#`–`####` headings
- ```` ``` ```` fenced code blocks (with language label)
- `>` blockquotes
- `-`/`*` unordered lists, `1.` ordered lists
- inline `` `code` ``, `**bold**`, `*italic*`
- paragraphs

Raw HTML is **not** a feature of the contract. Decision (per Phase 9C):
treat this as markdown-lite (Case B/C) and **render formatting as React
elements with raw HTML disabled by construction** — no sanitizer dependency is
needed because no HTML string is ever produced or parsed. This preserves all
formatting functionality while making HTML inert text.

## 4. Attack surface (pre-remediation, verified in browser)

The pre-fix renderer was tested with a faithful copy of its logic under
Chromium (positive control). Confirmed executable: `img onerror`, `svg onload`,
`iframe javascript:`, event handlers in list items / blockquotes / paragraphs,
including inside `**bold**` / `*italic*` / list contexts. Confirmed inert:
`<script>` via `dangerouslySetInnerHTML` (standard browser behaviour) — but all
variants were eliminated anyway because the renderer no longer creates markup.

## 5. Chosen remediation

New safe module: **`src/lib/education-renderer.tsx`**

- `renderEducationInline(text): ReactNode` — parses `**bold**`, `*italic*`,
  `` `code` `` into `<strong>` / `<em>` / `<code>` React elements. User text is
  passed as element **children**, so React escapes it; no HTML string exists.
- `parseEducationContent(content): { blocks, headings }` — the same block
  parser as before (headings, lists, blockquotes, fences, paragraphs), but all
  text output is React children. Headings remain `<h1..h4 id=…>` for the TOC.

`src/app/(public)/education/[slug]/page.tsx` now imports the module; its local
formatter/parser and **all four `dangerouslySetInnerHTML` sinks were deleted**.

Effective allowlist (elements the renderer can emit): `h1 h2 h3 h4 p strong em
code pre ul ol li blockquote`. No element or attribute comes from content;
`class`, `id`, `data-lang` values are hard-coded by the renderer.

URL policy: the renderer emits **no links and no URL-bearing attributes at
all**, so `javascript:`, `vbscript:`, `data:` URLs cannot reach the DOM from
content. If link support is ever required, it must be added together with an
explicit protocol allowlist (e.g. `https:`, `mailto:`) and `rel` handling.

## 6. Renderer configuration

- Inline pattern: `/\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`/g` (bold → italic → code
  precedence, matching the old behaviour); the regex is re-created per call so
  no `lastIndex` state leaks between calls.
- Keys are deterministic (no `Math.random()` keys as in the old code).
- React 19 automatic JSX runtime; module is environment-agnostic (server or
  client).

## 7. Server / client trust boundary

The public article page is a **server component**; content is fetched
server-side and transformed by `parseEducationContent` during RSC rendering.
Because output is composed of React elements, escaping happens at element
creation — the boundary holds on both server and client. Client components that
render AI-generated personal content already use React children only. The rule
recorded for future work: **any education content must go through
`src/lib/education-renderer.tsx`; never rebuild HTML strings from content.**

## 8. Handling of stored content

- Existing malicious rows in `education_public.content` are safe: the renderer
  escapes everything it renders. No database migration or data rewrite was
  performed (explicitly out of scope).
- Persistence-time sanitization was **deliberately not added**:
  stripping tags at write time would alter the content/API contract and could
  corrupt legitimate prose/code samples (e.g. fenced HTML snippets), while
  output-side escaping already closes the attack path for stored *and* future
  content. This is the documented tradeoff permitted by Phase 9I.
- `excerpt`, `title`, `tags` were already rendered as React text; unchanged.

## 9. Handling of AI-generated content

Gemini output (`generateEducationContent` → Inngest `education/generate` →
`education_personal.generatedContent` JSONB) is treated as untrusted input.
It is currently rendered by `education-personal-item.tsx` via React text nodes
(no HTML sink), and the personal content never flows through the public
renderer. If it ever does, `parseEducationContent` escapes it. The AI pipeline
itself was not modified (per scope).

## 10. Test payloads

Canonical payloads covered by the automated suites:

```html
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<svg onload=alert(1)>
<a href="javascript:alert(1)">click</a>
<div onclick="alert(1)">click</div>
<iframe src="javascript:alert(1)"></iframe>
<object data=javascript:alert(1)></object>
<embed src=javascript:alert(1)>
<img src="data:text/html;base64,…">
"> <img src=x onerror=…>            (attribute breakout)
**<img src=x onerror=…>**           (inside bold)
*<svg onload=…>*                    (inside italic)
`<script>…</script>`                (inside inline code)
- <img …> / 1. <img …>              (list contexts)
> <svg onload=…>                    (blockquote)
# <script>…</script>                (heading)
```html … ```                       (fenced code)
```

Benign formatting: headings, paragraphs, `**bold**`, `*italic*`, `` `code` ``,
unordered/ordered lists, blockquote, fenced code, special characters
(`5 < 3 & 2 > 1`).

### Synthetic suite

`tests/security/education-xss-check.tsx` — runs the real renderer through
`react-dom/server`, checks every payload for raw dangerous elements,
event-handler attributes, `javascript:`/`data:text/html` attribute URLs, tag
and attribute allowlists, and confirms benign formatting + TOC heading
extraction.

```
$ bun run tests/security/education-xss-check.tsx
[1] Detector self-test             5 passed
[2] Malicious payloads            23 passed
[3] Benign formatting              3 passed
31 passed, 0 failed
```

### Browser verification (Chromium)

1. **Positive control** (faithful copy of the old vulnerable logic, scratch
   harness): `img onerror` / `svg onload` payloads executed
   (`window.__xssTriggered === true`, `alert(1)` captured), dangerous DOM
   present → the harness detects real XSS.
2. **Safe renderer** (real `src/lib/education-renderer.tsx`): 24 payloads and
   clicks produced `window.__xssTriggered === false`, no alert calls, no
   `script/iframe/object/embed/svg/img/a` elements, no `on*` attributes;
   payloads visible as escaped text; benign formatting rendered
   (`strong`, `em`, `ul`, `ol`, `blockquote`, headings, code fence).
3. **Production-build canary**: `next build` + `next start` (port 3100) served
   `/education/phase9-xss-canary` through the **real production route**, with a
   mock upstream API on port 3000 (the `NEXT_PUBLIC_APP_URL`) returning the
   crafted stored-XSS article. No database writes. Result: HTTP 200,
   `window.__xssTriggered === false`, no alert/dialog, no dangerous DOM, no raw
   `<script` sequence, escaped payloads visible, benign formatting intact,
   0 console errors, 0 page exceptions.

Browser used: Chromium (Playwright 1.63.0, bundled cached build), headless.

## 11. Browser verification details

- Instrumentation injected **before** any app code (`addInitScript`) so
  payloads firing during HTML parse would flip `window.__xssTriggered`; native
  dialogs were also captured.
- Article body queried at `.prose.prose-lg`; DOM assertions limited to the
  article container.
- Exact evidence logs (standalone + canary + runtime) were captured during
  Phase 9 execution; the canary server logs showed no error responses.

## 12. Remaining security limitations

- If product requirements later need links/images in articles, an explicit
  URL/protocol allowlist must be added to the renderer; the current renderer
  intentionally emits none.
- No persistence-time sanitization: any other consumer that reads raw
  `content` must not build HTML from it. The API response contract therefore
  still returns raw markdown-lite text (intentionally unchanged).
- No Content-Security-Policy is configured (defense in depth); adding CSP is a
  separate enhancement, not required to close this path.
- `thumbnailUrl` is rendered through `next/image` with `remotePatterns`
  restricted to `res.cloudinary.com`; non-matching URLs fail image loading
  rather than executing anything.
- The two JSON-LD `dangerouslySetInnerHTML` occurrences use hard-coded static
  objects only; they must never be fed user/profile data without escaping.

## 13. Deferred security issues

- **`bun audit`: 121 pre-existing vulnerabilities (2 critical, 71 high,
  44 moderate, 4 low)** in transitive dependency trees (`node-tar`, `tar`,
  `brace-expansion`, `fast-uri`, `minimatch`, `protobufjs`, `uuid` via
  `inngest > @opentelemetry/...`, `webpack` via `@ducanh2912/next-pwa`, …).
  Phase 9 changed **no dependencies**, so the audit result is unchanged by this
  phase; remediation is out of scope and was not attempted.
- Admin authorization for education management is client-side `AdminGuard` +
  signed-in middleware only (pre-existing audit §7) — not an XSS matter, left
  deferred.
- `react-markdown`, `rehype-raw`, `remark-gfm` remain declared but unused.
  If raw HTML support is ever introduced, `rehype-raw` must not be used
  without an allowlist sanitizer; the recommended path is the current safe
  renderer.

---

## Files (Phase 9)

| File | Change |
|---|---|
| `src/lib/education-renderer.tsx` | **new** safe React renderer (no HTML strings) |
| `src/app/(public)/education/[slug]/page.tsx` | uses safe renderer; 4× `dangerouslySetInnerHTML` removed |
| `tests/security/education-xss-check.tsx` | **new** synthetic XSS regression suite |

No dependency, lockfile, database, API-contract, Clerk, Inngest, AI, or PWA
configuration changes.
