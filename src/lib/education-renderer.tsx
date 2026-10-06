// src/lib/education-renderer.tsx
//
// SECURITY (Phase 9 — XSS remediation)
// ---------------------------------------------------------------------------
// Safe renderer for public education article content ("markdown-lite").
//
// This module intentionally NEVER builds HTML strings and NEVER uses
// `dangerouslySetInnerHTML`. Every piece of stored content is returned as
// React text nodes / elements, so React escapes it before it reaches the DOM.
// Raw HTML that may exist in stored (admin-authored or legacy) content is
// rendered as literal visible text, not parsed as markup or executed.
//
// Content contract supported (same as the previous renderer):
//   - code fences (```), headings (#..####), blockquotes (> ), ordered and
//     unordered lists, inline `code`, **bold**, *italic*, paragraphs.
//
// Attackers can control: `education_public.content` (stored XSS) and any
// future content source. Treat ALL input to this module as untrusted.
//
// See docs/xss-remediation.md for the full audit and test evidence.

import type { ReactNode } from "react";

export type EducationHeading = { id: string; text: string; level: number };

/** Slugify heading text for the table-of-contents anchors. */
export function slugifyEducationHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Inline formatting: **bold**, *italic*, `inline code`.
 *
 * Returns React nodes; caller text is inserted as children so React escapes
 * any HTML/special characters. No raw HTML string is ever produced.
 */
export function renderEducationInline(text: string): ReactNode {
  if (!text) return text;

  const nodes: ReactNode[] = [];
  // A fresh regex per call — avoids shared lastIndex state between calls.
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`/g;

  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[1] !== undefined) {
      nodes.push(<strong key={`strong-${key++}`}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      nodes.push(<em key={`em-${key++}`}>{match[2]}</em>);
    } else if (match[3] !== undefined) {
      nodes.push(
        <code key={`code-${key++}`} className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
          {match[3]}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

/**
 * Parse markdown-lite content into React nodes and extract headings.
 * Supports: code fences (```), headings (#..####), blockquotes,
 * ordered/unordered lists, inline code, paragraphs.
 */
export function parseEducationContent(content: string): {
  blocks: ReactNode[];
  headings: EducationHeading[];
} {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  const headings: EducationHeading[] = [];

  let i = 0;
  let inCode = false;
  let codeLang = "";
  let codeBuffer: string[] = [];
  let listBuffer: { ordered: boolean; items: string[] } | null = null;

  const flushList = () => {
    if (!listBuffer) return;
    const keyBase = blocks.length;

    if (listBuffer.ordered) {
      blocks.push(
        <ol key={`ol-${keyBase}`} className="my-4 ml-6 list-decimal">
          {listBuffer.items.map((it, idx) => (
            <li key={idx} className="text-foreground">
              {renderEducationInline(it)}
            </li>
          ))}
        </ol>
      );
    } else {
      blocks.push(
        <ul key={`ul-${keyBase}`} className="my-4 ml-6 list-disc">
          {listBuffer.items.map((it, idx) => (
            <li key={idx} className="text-foreground">
              {renderEducationInline(it)}
            </li>
          ))}
        </ul>
      );
    }

    listBuffer = null;
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.replace(/\t/g, "    ");

    // code block start/end
    if (line.trim().startsWith("```")) {
      if (!inCode) {
        inCode = true;
        codeLang = line.trim().slice(3).trim();
        codeBuffer = [];
      } else {
        inCode = false;
        blocks.push(
          <pre
            key={`code-${blocks.length}`}
            className="bg-muted px-4 py-3 rounded-lg overflow-auto text-sm font-mono"
          >
            <code data-lang={codeLang || "text"}>{codeBuffer.join("\n")}</code>
          </pre>
        );
        codeBuffer = [];
        codeLang = "";
      }
      i++;
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      i++;
      continue;
    }

    // headings
    const hMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (hMatch) {
      flushList();
      const level = hMatch[1].length;
      const text = hMatch[2].trim();
      const id = slugifyEducationHeading(text);
      headings.push({ id, text, level });

      if (level === 1) {
        blocks.push(
          <h1 key={`h1-${id}`} id={id} className="text-3xl font-bold mt-8 mb-4 text-foreground">
            {text}
          </h1>
        );
      } else if (level === 2) {
        blocks.push(
          <h2 key={`h2-${id}`} id={id} className="text-2xl font-bold mt-6 mb-3 text-foreground">
            {text}
          </h2>
        );
      } else if (level === 3) {
        blocks.push(
          <h3 key={`h3-${id}`} id={id} className="text-xl font-semibold mt-5 mb-2 text-foreground">
            {text}
          </h3>
        );
      } else {
        blocks.push(
          <h4 key={`h4-${id}`} id={id} className="text-lg font-semibold mt-4 mb-2 text-foreground">
            {text}
          </h4>
        );
      }
      i++;
      continue;
    }

    // blockquote
    if (line.trim().startsWith("> ")) {
      flushList();
      const quote = line.trim().slice(2);
      blocks.push(
        <blockquote
          key={`bq-${blocks.length}`}
          className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground"
        >
          {renderEducationInline(quote)}
        </blockquote>
      );
      i++;
      continue;
    }

    // unordered list
    if (line.trim().match(/^[-*]\s+/)) {
      const item = line.trim().replace(/^[-*]\s+/, "");
      if (!listBuffer) listBuffer = { ordered: false, items: [] };
      listBuffer.items.push(item);
      i++;
      while (i < lines.length) {
        const nxt = lines[i].trim();
        if (nxt.match(/^[-*]\s+/)) {
          listBuffer.items.push(nxt.replace(/^[-*]\s+/, ""));
          i++;
        } else break;
      }
      flushList();
      continue;
    }

    // ordered list
    if (line.trim().match(/^\d+\.\s+/)) {
      const item = line.trim().replace(/^\d+\.\s+/, "");
      if (!listBuffer) listBuffer = { ordered: true, items: [] };
      listBuffer.items.push(item);
      i++;
      while (i < lines.length) {
        const nxt = lines[i].trim();
        if (nxt.match(/^\d+\.\s+/)) {
          listBuffer.items.push(nxt.replace(/^\d+\.\s+/, ""));
          i++;
        } else break;
      }
      flushList();
      continue;
    }

    // inline code line
    const inlineCodeMatch = line.match(/^`(.+)`$/);
    if (inlineCodeMatch) {
      flushList();
      blocks.push(
        <code
          key={`ic-${blocks.length}`}
          className="bg-muted px-2 py-1 rounded text-sm font-mono text-foreground"
        >
          {inlineCodeMatch[1]}
        </code>
      );
      i++;
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    // paragraph (gather lines until blank)
    const paraLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].match(/^(#{1,4})\s+/) &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().match(/^[-*]\s+/) &&
      !lines[i].trim().match(/^\d+\.\s+/) &&
      !lines[i].trim().startsWith("> ")
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    const para = paraLines.join("\n").trim();
    blocks.push(
      <p key={`p-${blocks.length}`} className="mb-4 leading-relaxed text-foreground">
        {renderEducationInline(para)}
      </p>
    );
  }

  return { blocks, headings };
}
