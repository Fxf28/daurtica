// src/components/dashboard/education-personal-item.tsx
"use client";

import { useState, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { EducationPersonal } from "@/types/education";
import { Calendar, User, Eye, Tag, Clock, RefreshCw, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { regenerateEducationPersonal, deleteEducationPersonal } from "@/lib/api/education-personal";
import { toast } from "sonner";

// Tambahkan prop interface
interface EducationPersonalItemProps {
    article: EducationPersonal;
    onUpdate: () => void;
    onArticleUpdated?: (article: EducationPersonal) => void;
}

export function EducationPersonalItem({ article, onUpdate, onArticleUpdated }: EducationPersonalItemProps) {
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

    const formatDate = (dateInput: Date | string) => {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const formatReadingTime = (content: string) => {
        const wordsPerMinute = 200;
        const words = content.split(/\s/g).length;
        const minutes = Math.ceil(words / wordsPerMinute);
        return `${minutes} menit baca`;
    };

    const toggleSection = (index: number) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        try {
            await regenerateEducationPersonal(article.id);
            toast.success("Regenerasi artikel dimulai!");

            // Notify parent tentang regenerasi
            if (onArticleUpdated) {
                onArticleUpdated({
                    ...article,
                    title: "Regenerating...",
                    generatedContent: {
                        title: "Regenerating...",
                        content: "Your content is being regenerated. Please wait a moment.",
                        sections: [],
                    }
                });
            }

            onUpdate();
        } catch (error) {
            console.error("Regeneration failed:", error);
            toast.error("Gagal memulai regenerasi artikel");
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Apakah Anda yakin ingin menghapus artikel "${article.title}"?`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteEducationPersonal(article.id);
            toast.success("Artikel berhasil dihapus");
            onUpdate();
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Gagal menghapus artikel");
        } finally {
            setIsDeleting(false);
        }
    };

    // Helper untuk render markdown content dengan aman
    const renderMarkdownContent = (content: string): ReactNode[] => {
        return content.split('\n').map((paragraph, index): ReactNode => {
            if (paragraph.trim() === '') {
                return <div key={index} className="h-4" />; // Empty line
            } else if (paragraph.startsWith('# ')) {
                return <h1 key={index} className="text-2xl font-bold mt-6 mb-4 text-foreground">{paragraph.substring(2)}</h1>;
            } else if (paragraph.startsWith('## ')) {
                return <h2 key={index} className="text-xl font-bold mt-5 mb-3 text-foreground">{paragraph.substring(3)}</h2>;
            } else if (paragraph.startsWith('### ')) {
                return <h3 key={index} className="text-lg font-bold mt-4 mb-2 text-foreground">{paragraph.substring(4)}</h3>;
            } else if (paragraph.startsWith('#### ')) {
                return <h4 key={index} className="text-base font-bold mt-3 mb-2 text-foreground">{paragraph.substring(5)}</h4>;
            } else if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                return (
                    <div key={index} className="flex items-start mb-2">
                        <span className="text-foreground mr-2 mt-1">•</span>
                        <span className="text-foreground flex-1">{paragraph.substring(2)}</span>
                    </div>
                );
            } else {
                // Handle basic markdown formatting
                const elements: ReactNode[] = [];

                // Handle bold text
                const boldRegex = /\*\*(.*?)\*\*/g;
                let lastIndex = 0;
                let match: RegExpExecArray | null;

                while ((match = boldRegex.exec(paragraph)) !== null) {
                    // Text before bold
                    if (match.index > lastIndex) {
                        elements.push(
                            <span key={`text-${lastIndex}`}>
                                {paragraph.slice(lastIndex, match.index)}
                            </span>
                        );
                    }
                    // Bold text
                    elements.push(
                        <strong key={`bold-${match.index}`} className="font-semibold">
                            {match[1]}
                        </strong>
                    );
                    lastIndex = match.index + match[0].length;
                }

                // Remaining text
                if (lastIndex < paragraph.length) {
                    elements.push(
                        <span key={`text-${lastIndex}`}>
                            {paragraph.slice(lastIndex)}
                        </span>
                    );
                }

                return (
                    <p key={index} className="mb-4 leading-relaxed text-foreground">
                        {elements.length > 0 ? elements : paragraph}
                    </p>
                );
            }
        });
    };

    // Helper untuk render section content dengan format yang lebih baik
    const renderSectionContent = (content: string): ReactNode[] => {
        return content.split('\n').map((paragraph, index): ReactNode => {
            if (paragraph.trim() === '') {
                return <div key={index} className="h-3" />;
            } else if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                return (
                    <div key={index} className="flex items-start mb-2">
                        <span className="text-muted-foreground mr-2 mt-1">•</span>
                        <span className="text-muted-foreground flex-1">{paragraph.substring(2)}</span>
                    </div>
                );
            } else {
                return (
                    <p key={index} className="mb-3 leading-relaxed text-muted-foreground">
                        {paragraph}
                    </p>
                );
            }
        });
    };

    return (
        <>
            {/* Card Item */}
            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group h-full flex flex-col">
                <CardHeader className="pb-3 flex-shrink-0">
                    <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors flex-1 min-w-0">
                            {article.title}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                            {article.id.substring(0, 6)}...
                        </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(article.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatReadingTime(article.generatedContent.content)}</span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pb-4 flex-1 flex flex-col">
                    {/* Tags */}
                    {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                            {article.tags.slice(0, 3).map((tag) => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs max-w-[120px] truncate"
                                    title={tag}
                                >
                                    <Tag className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="truncate">{tag}</span>
                                </Badge>
                            ))}
                            {article.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    +{article.tags.length - 3}
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Prompt */}
                    <div className="mb-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            <strong>Prompt:</strong> {article.prompt}
                        </p>
                    </div>

                    {/* Content Preview */}
                    {article.generatedContent && (
                        <div className="space-y-2 flex-1">
                            <div className="prose prose-sm max-w-none">
                                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                    {article.generatedContent.content.substring(0, 150)}...
                                </p>
                            </div>

                            {/* Section badges */}
                            <div className="flex flex-wrap gap-1 mt-2">
                                {article.generatedContent.sections?.slice(0, 2).map((section, index) => (
                                    <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs max-w-[140px] truncate"
                                        title={section.title}
                                    >
                                        {section.title}
                                    </Badge>
                                ))}
                                {article.generatedContent.sections && article.generatedContent.sections.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{article.generatedContent.sections.length - 2}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-3 border-t">
                        <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={() => setIsDetailOpen(true)}
                        >
                            <Eye className="h-4 w-4 mr-2" />
                            Baca
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRegenerate}
                            disabled={isRegenerating}
                            className="px-3"
                        >
                            {isRegenerating ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Detail Modal */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                    <DialogHeader>
                        <DialogTitle className="text-xl sm:text-2xl break-words">
                            {article.title}
                        </DialogTitle>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-2">
                            <div className="flex items-center gap-1">
                                <User className="h-4 w-4 flex-shrink-0" />
                                <span className="text-xs sm:text-sm truncate">
                                    User: {article.userId.substring(0, 12)}...
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 flex-shrink-0" />
                                <span className="text-xs sm:text-sm">{formatDate(article.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 flex-shrink-0" />
                                <span className="text-xs sm:text-sm">{formatReadingTime(article.generatedContent.content)}</span>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Tags */}
                    {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {article.tags.map((tag) => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-sm max-w-[160px] truncate"
                                    title={tag}
                                >
                                    <Tag className="h-3 w-3 mr-1 flex-shrink-0" />
                                    <span className="truncate">{tag}</span>
                                </Badge>
                            ))}
                        </div>
                    )}

                    {/* Prompt */}
                    <div className="bg-muted/30 rounded-lg p-4">
                        <h3 className="font-semibold mb-2 text-sm sm:text-base">Prompt yang digunakan:</h3>
                        <p className="text-sm text-muted-foreground break-words">{article.prompt}</p>
                    </div>

                    {/* Generated Content */}
                    <div className="space-y-6">
                        {/* Main Content */}
                        <div className="prose prose-sm sm:prose-base max-w-none bg-background p-4 rounded-lg border">
                            <div className="text-lg font-semibold mb-4 text-foreground">Konten Utama</div>
                            {renderMarkdownContent(article.generatedContent.content)}
                        </div>

                        {/* Sections dengan Accordion */}
                        {article.generatedContent.sections && article.generatedContent.sections.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Bagian-bagian Artikel:</h3>
                                <div className="space-y-3">
                                    {article.generatedContent.sections.map((section, index) => (
                                        <div key={index} className="border rounded-lg overflow-hidden bg-card">
                                            <button
                                                onClick={() => toggleSection(index)}
                                                className="w-full p-4 text-left flex justify-between items-center hover:bg-muted/50 transition-colors"
                                            >
                                                <h4 className="font-semibold text-base flex items-center gap-2">
                                                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">
                                                        {index + 1}
                                                    </span>
                                                    {section.title}
                                                </h4>
                                                {expandedSections.has(index) ? (
                                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </button>
                                            {expandedSections.has(index) && (
                                                <div className="p-4 border-t bg-muted/20">
                                                    <div className="prose prose-sm max-w-none">
                                                        {renderSectionContent(section.content)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Quick Actions untuk Sections */}
                                <div className="flex gap-2 flex-wrap">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setExpandedSections(new Set(article.generatedContent.sections?.map((_, i) => i)))}
                                    >
                                        Buka Semua
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setExpandedSections(new Set())}
                                    >
                                        Tutup Semua
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t mt-4 sticky bottom-0 bg-background">
                        <Button
                            variant="outline"
                            onClick={handleRegenerate}
                            disabled={isRegenerating}
                            className="flex-1"
                        >
                            {isRegenerating ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Sedang Regenerate...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Regenerate Konten
                                </>
                            )}
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="sm:w-auto"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {isDeleting ? "Menghapus..." : "Hapus"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}