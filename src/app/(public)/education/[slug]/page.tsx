// src/app/(public)/education/[slug]/page.tsx
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getEducationPublicBySlug } from "@/lib/api/education-public";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Tag, ArrowLeft } from "lucide-react";
import { ShareButton } from "@/components/share-button";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import clsx from "clsx";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    try {
        const article = await getEducationPublicBySlug(slug);

        if (!article) {
            return {
                title: "Artikel Tidak Ditemukan - Edukasi Sampah",
                description: "Artikel edukasi tidak ditemukan",
            };
        }

        return {
            title: `${article.title} - Edukasi Sampah`,
            description: article.excerpt || article.content.substring(0, 160),
            openGraph: {
                title: article.title,
                description: article.excerpt || article.content.substring(0, 160),
                images: article.thumbnailUrl ? [article.thumbnailUrl] : [],
                type: "article",
                publishedTime: article.createdAt.toString(),
            },
        };
    } catch {
        return {
            title: "Artikel - Edukasi Sampah",
            description: "Artikel edukasi pengelolaan sampah",
        };
    }
}

/**
 * Utility: slugify for headings
 */
function slugify(text: string) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

type Heading = { id: string; text: string; level: number };

/**
 * Inline formatting renderer
 * Supports: **bold**, *italic*, `inline code`
 */
function renderInlineFormatting(text: string) {
    if (!text) return text;

    return text
        // bold
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        // italic
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        // inline code
        .replace(/`([^`]+)`/g, "<code class='bg-muted px-1 py-0.5 rounded text-sm font-mono'>$1</code>");
}

/**
 * parseContent: parse simple markdown-like text into React nodes and extract headings.
 * Supports: code fences (```), headings (#..####), blockquotes, ordered/unordered lists, inline code, paragraphs.
 */
function parseContent(content: string) {
    const lines = content.split(/\r?\n/);
    const blocks: React.ReactNode[] = [];
    const headings: Heading[] = [];

    let i = 0;
    let inCode = false;
    let codeLang = "";
    let codeBuffer: string[] = [];
    let listBuffer: { ordered: boolean; items: string[] } | null = null;

    const flushList = () => {
        if (!listBuffer) return;
        if (listBuffer.ordered) {
            blocks.push(
                <ol key={`ol-${Math.random()}`} className="my-4 ml-6 list-decimal">
                    {listBuffer.items.map((it, idx) => (
                        <li
                            key={idx}
                            className="text-foreground"
                            dangerouslySetInnerHTML={{ __html: renderInlineFormatting(it) }}
                        ></li>
                    ))}
                </ol>
            );
        } else {
            blocks.push(
                <ul key={`ul-${Math.random()}`} className="my-4 ml-6 list-disc">
                    {listBuffer.items.map((it, idx) => (
                        <li
                            key={idx}
                            className="text-foreground"
                            dangerouslySetInnerHTML={{ __html: renderInlineFormatting(it) }}
                        ></li>
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
                        key={`code-${Math.random()}`}
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
            const id = slugify(text);
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
                    key={`bq-${Math.random()}`}
                    className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: renderInlineFormatting(quote) }}
                ></blockquote>
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

        // inline code
        const inlineCodeMatch = line.match(/^`(.+)`$/);
        if (inlineCodeMatch) {
            flushList();
            blocks.push(
                <code
                    key={`ic-${Math.random()}`}
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
            <p
                key={`p-${Math.random()}`}
                className="mb-4 leading-relaxed text-foreground"
                dangerouslySetInnerHTML={{ __html: renderInlineFormatting(para) }}
            ></p>
        );
    }

    return { blocks, headings };
}

export default async function EducationArticlePage({ params }: Props) {
    const { slug } = await params;
    let article;

    try {
        article = await getEducationPublicBySlug(slug);
    } catch (err) {
        console.error("Error fetching article", err);
        notFound();
    }

    if (!article) notFound();

    const formatDate = (dateInput: Date | string) => {
        const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    const formatReadingTime = (minutes: number | null | undefined) => {
        if (!minutes) return "Belum dihitung";
        return `${minutes} menit baca`;
    };

    const { blocks, headings } = parseContent(article.content || "");

    return (
        <div className="min-h-screen bg-background">
            {/* Top Nav */}
            <div className="border-b bg-background/50 backdrop-blur">
                <div className="container max-w-6xl mx-auto px-4 md:px-6 py-4">
                    <Link href="/education">
                        <Button variant="ghost" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali ke Daftar Artikel
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Main layout: content + right TOC (desktop) */}
            <div className="container max-w-6xl mx-auto px-4 md:px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Article column */}
                <div className="lg:col-span-2">
                    {/* Meta / Title */}
                    <header className="mb-6">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight mb-3">
                            {article.title}
                        </h1>

                        <div className="flex flex-wrap gap-4 items-center text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(article.createdAt)}</span>
                            </div>
                            {article.readingTime && (
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{formatReadingTime(article.readingTime)}</span>
                                </div>
                            )}
                        </div>

                        {/* Tags */}
                        {article.tags && article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {article.tags.map((tag: string) => (
                                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                        <Tag className="h-3 w-3" />
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Share */}
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-sm text-muted-foreground">Dibagikan untuk edukasi publik</p>
                            <div>
                                <ShareButton title={article.title} text={article.excerpt || article.content.substring(0, 120)} />
                            </div>
                        </div>
                    </header>

                    {/* Thumbnail (responsive) */}
                    {article.thumbnailUrl && (
                        <div className="mb-8 rounded-xl overflow-hidden shadow-sm">
                            <Image
                                src={article.thumbnailUrl}
                                alt={article.title}
                                width={1200}
                                height={640}
                                className="w-full h-60 md:h-80 object-cover rounded-lg"
                                priority
                                loading="eager"
                            />
                        </div>
                    )}

                    {/* Excerpt */}
                    {article.excerpt && (
                        <div className="bg-muted/50 rounded-lg p-6 mb-8">
                            <p className="text-lg italic text-muted-foreground leading-relaxed">{article.excerpt}</p>
                        </div>
                    )}

                    {/* Article Body */}
                    <div className="prose prose-lg max-w-none">{blocks}</div>

                    {/* CTA */}
                    <div className="mt-12 p-6 bg-primary/10 rounded-lg text-center">
                        <h3 className="text-xl font-semibold mb-2">Mari Jaga Lingkungan Bersama</h3>
                        <p className="text-muted-foreground mb-4">
                            Terima kasih telah membaca artikel ini. Mari kita praktikkan pengetahuan tentang pengelolaan
                            sampah untuk lingkungan yang lebih baik.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link href="/education">
                                <Button variant="outline">Baca Artikel Lain</Button>
                            </Link>
                            <Link href="/classify">
                                <Button>Klasifikasi Sampah</Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right column: TOC (desktop only) */}
                <aside className="hidden lg:block sticky top-28 self-start">
                    <div className="w-60 p-4 rounded-lg border bg-card shadow-sm">

                        <h4 className="text-sm font-semibold mb-3">Daftar Isi</h4>

                        <div className="max-h-[70vh] overflow-y-auto pr-1">
                            {headings.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Tidak ada struktur heading.
                                </p>
                            ) : (
                                <nav className="text-sm space-y-2">
                                    {headings.map((h) => {
                                        const indentClass = clsx({
                                            "pl-0": h.level === 1,
                                            "pl-3": h.level === 2,
                                            "pl-6": h.level === 3,
                                            "pl-9": h.level >= 4,
                                        });
                                        return (
                                            <a
                                                key={h.id}
                                                href={`#${h.id}`}
                                                className={`${indentClass} block hover:text-primary transition text-muted-foreground`}
                                            >
                                                <span
                                                    className={`text-foreground ${h.level === 1 ? "font-medium" : "text-sm"
                                                        }`}
                                                >
                                                    {h.text}
                                                </span>
                                            </a>
                                        );
                                    })}
                                </nav>
                            )}
                        </div>

                        {/* small share + read time */}
                        <div className="mt-4 pt-4 border-t">
                            <p className="text-xs text-muted-foreground">
                                {article.readingTime
                                    ? `${article.readingTime} menit baca`
                                    : "Estimasi waktu belum tersedia"}
                            </p>
                            <div className="mt-2">
                                <ShareButton
                                    title={article.title}
                                    text={article.excerpt || article.content.substring(0, 120)}
                                />
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
