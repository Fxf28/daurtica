/**
 * Phase 9 — Focused XSS regression checks for the education renderer.
 *
 * Exercises the REAL renderer module (`src/lib/education-renderer.tsx`)
 * through React's server renderer and asserts that untrusted education
 * content can never produce executable markup or links.
 *
 * This is a synthetic/unit check (string + DOM-model level). Browser-level
 * verification is run separately with Playwright; see docs/xss-remediation.md.
 *
 * Run: bun run tests/security/education-xss-check.tsx
 */
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { parseEducationContent, renderEducationInline } from "@/lib/education-renderer";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALLOWED_TAGS = new Set([
  "h1", "h2", "h3", "h4",
  "p", "strong", "em", "code", "pre",
  "ul", "ol", "li", "blockquote",
]);

const ALLOWED_ATTRS = new Set(["class", "id", "data-lang"]);

const DANGEROUS_MARKUP: { name: string; re: RegExp }[] = [
  { name: "raw <script> element", re: /<script[\s>]/i },
  { name: "raw <img> element", re: /<img[\s>]/i },
  { name: "raw <svg> element", re: /<svg[\s>]/i },
  { name: "raw <iframe> element", re: /<iframe[\s>]/i },
  { name: "raw <object>/<embed> element", re: /<(object|embed)[\s>]/i },
];

const DANGEROUS_ATTRS: { name: string; re: RegExp }[] = [
  { name: "event-handler attribute", re: /\son[a-z]+\s*=/i },
  { name: "javascript: URL in attribute", re: /\b(href|src|xlink:href)\s*=\s*["']?\s*javascript:/i },
  { name: "data:text/html URL in attribute", re: /\b(href|src)\s*=\s*["']?\s*data:text\/html/i },
];

function renderContent(content: string): string {
  const { blocks } = parseEducationContent(content);
  return renderToStaticMarkup(<>{blocks}</>);
}

function extractTags(html: string): string[] {
  return [...html.matchAll(/<([a-z0-9]+)[\s/>]/gi)].map((m) => m[1].toLowerCase());
}

/** Raw tags only — escaped text (e.g. `&lt;img ...&gt;`) never matches. */
function extractRawTags(html: string): string[] {
  return html.match(/<[a-z][^>]*>/gi) ?? [];
}

function extractAttrs(tagHtml: string): string[] {
  return [...tagHtml.matchAll(/\s([a-zA-Z-]+)=/g)].map((a) => a[1].toLowerCase());
}

function assertSafeMarkup(label: string, markup: string) {
  // Element-level detectors apply to the whole output: escaped text cannot
  // contain a raw `<script`/`<img`/... sequence.
  for (const { name, re } of DANGEROUS_MARKUP) {
    assert.ok(!re.test(markup), `${label}: produced ${name}: ${JSON.stringify(markup)}`);
  }

  // Attribute-level detectors apply to raw tags only; otherwise the literal
  // text `src=javascript:` inside an escaped payload would be a false positive.
  const rawTags = extractRawTags(markup);
  for (const tag of rawTags) {
    for (const { name, re } of DANGEROUS_ATTRS) {
      assert.ok(!re.test(tag), `${label}: produced ${name}: ${JSON.stringify(tag)}`);
    }
    const tagName = tag.match(/^<([a-z0-9]+)/i)?.[1].toLowerCase();
    assert.ok(tagName && ALLOWED_TAGS.has(tagName), `${label}: disallowed tag ${JSON.stringify(tag)}`);
    for (const attr of extractAttrs(tag)) {
      assert.ok(ALLOWED_ATTRS.has(attr), `${label}: disallowed attribute "${attr}" in ${JSON.stringify(tag)}`);
    }
  }

  const tags = extractTags(markup);
  for (const tag of tags) {
    assert.ok(ALLOWED_TAGS.has(tag), `${label}: disallowed tag <${tag}> in ${JSON.stringify(markup)}`);
  }
}

// ---------------------------------------------------------------------------
// Minimal runner
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function check(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  \u2713 ${name}`);
  } catch (error) {
    failed++;
    console.error(`  \u2717 ${name}`);
    console.error(`      ${(error as Error).message}`);
  }
}

// ---------------------------------------------------------------------------
// 1. Detector self-test (positive control)
//    Ensures the dangerous-pattern detectors actually fire on raw payloads.
// ---------------------------------------------------------------------------

console.log("\n[1] Detector self-test (must detect raw payloads)");

const rawPayloads = [
  "<script>alert(1)</script>",
  "<img src=x onerror=alert(1)>",
  "<svg onload=alert(1)>",
  '<a href="javascript:alert(1)">click</a>',
  "<iframe src=javascript:alert(1)></iframe>",
];

for (const raw of rawPayloads) {
  check(`detects raw payload ${JSON.stringify(raw)}`, () => {
    const detected =
      DANGEROUS_MARKUP.some(({ re }) => re.test(raw)) ||
      extractRawTags(raw).some((tag) => DANGEROUS_ATTRS.some(({ re }) => re.test(tag)));
    assert.ok(detected, "no dangerous pattern detected on raw payload — detectors are dead");
  });
}

// ---------------------------------------------------------------------------
// 2. Malicious payloads (Phase 9L)
// ---------------------------------------------------------------------------

console.log("\n[2] Malicious payloads must render as inert text / escaped markup");

const XSS_PAYLOADS: { label: string; payload: string }[] = [
  { label: "script tag", payload: "<script>alert(1)</script>" },
  { label: "img onerror", payload: "<img src=x onerror=alert(1)>" },
  { label: "svg onload", payload: "<svg onload=alert(1)>" },
  { label: "a javascript: URL", payload: '<a href="javascript:alert(1)">click</a>' },
  { label: "div onclick", payload: '<div onclick="alert(1)">click</div>' },
  { label: "iframe javascript:", payload: '<iframe src="javascript:alert(1)"></iframe>' },
  { label: "object data javascript:", payload: "<object data=javascript:alert(1)></object>" },
  { label: "embed javascript:", payload: "<embed src=javascript:alert(1)>" },
  { label: "img data:text/html", payload: '<img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">' },
  { label: "uppercase SCRIPT", payload: "<SCRIPT>alert(1)</SCRIPT>" },
  { label: "attribute-breakout quote", payload: '"><img src=x onerror=alert(1)>' },
  { label: "img inside bold", payload: "**<img src=x onerror=alert(1)>**" },
  { label: "svg inside italic", payload: "*<svg onload=alert(1)>*" },
  { label: "script inside inline code", payload: "`<script>alert(1)</script>`" },
  { label: "img in list item", payload: "- <img src=x onerror=alert(1)>" },
  { label: "svg in blockquote", payload: "> <svg onload=alert(1)>" },
  { label: "script in heading", payload: "# <script>alert(1)</script>" },
  { label: "script in fenced code", payload: "```html\n<script>alert(1)</script>\n```" },
  { label: "img in ordered list", payload: "1. <img src=x onerror=alert(1)>" },
];

for (const { label, payload } of XSS_PAYLOADS) {
  check(`paragraph/renderer path: ${label}`, () => {
    const markup = renderContent(payload);
    assertSafeMarkup(label, markup);
    if (payload.includes("<")) {
      assert.ok(markup.includes("&lt;"), `${label}: payload was not text-escaped: ${JSON.stringify(markup)}`);
    }
  });
}

const INLINE_PAYLOADS = [
  "<script>alert(1)</script>",
  '<img src=x onerror=alert(1)>',
  "<svg onload=alert(1)>",
  "<iframe src=javascript:alert(1)></iframe>",
];

for (const payload of INLINE_PAYLOADS) {
  check(`renderEducationInline path: ${payload}`, () => {
    const markup = renderToStaticMarkup(<p>{renderEducationInline(payload)}</p>);
    assertSafeMarkup(payload, markup);
  });
}

// ---------------------------------------------------------------------------
// 3. Benign formatting must still render
// ---------------------------------------------------------------------------

console.log("\n[3] Benign formatting must keep working");

check("headings (h1/h2), bold, italic, inline code, lists, blockquote, fence", () => {
  const content = [
    "# Heading 1",
    "",
    "## Heading 2",
    "",
    "**Bold** and *Italic* and `inline-code`",
    "",
    "- Item A",
    "- Item B",
    "",
    "1. First",
    "2. Second",
    "",
    "> Quote text",
    "",
    "```js",
    "const x = 1;",
    "```",
  ].join("\n");

  const { blocks, headings } = parseEducationContent(content);
  const markup = renderToStaticMarkup(<>{blocks}</>);

  assert.ok(markup.includes('<h1 id="heading-1"'), "missing h1");
  assert.ok(markup.includes('<h2 id="heading-2"'), "missing h2");
  assert.ok(markup.includes("<strong>Bold</strong>"), "missing strong");
  assert.ok(markup.includes("<em>Italic</em>"), "missing em");
  assert.ok(markup.includes(">inline-code</code>"), "missing inline code");
  assert.ok(markup.includes('<ul class="my-4 ml-6 list-disc">'), "missing ul");
  assert.ok(markup.includes(">Item A</li>"), "missing li Item A");
  assert.ok(markup.includes('<ol class="my-4 ml-6 list-decimal">'), "missing ol");
  assert.ok(markup.includes(">First</li>"), "missing ol item");
  assert.ok(markup.includes("<blockquote"), "missing blockquote");
  assert.ok(markup.includes(">Quote text</blockquote>"), "missing quote text");
  assert.ok(markup.includes('<code data-lang="js">const x = 1;</code>'), "missing code fence");

  assert.deepEqual(
    headings.map((h) => ({ id: h.id, level: h.level, text: h.text })),
    [
      { id: "heading-1", level: 1, text: "Heading 1" },
      { id: "heading-2", level: 2, text: "Heading 2" },
    ],
    "heading extraction / TOC anchors changed",
  );

  assertSafeMarkup("benign formatting", markup);
});

check("special characters are escaped, not interpreted", () => {
  const markup = renderContent("5 < 3 & 2 > 1");
  assert.ok(markup.includes("5 &lt; 3 &amp; 2 &gt; 1"), `not escaped: ${JSON.stringify(markup)}`);
});

check("standalone inline-code line still renders as <code>", () => {
  const markup = renderContent("`standalone`");
  assert.ok(markup.includes(">standalone</code>"), `missing standalone code: ${JSON.stringify(markup)}`);
});

// ---------------------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
