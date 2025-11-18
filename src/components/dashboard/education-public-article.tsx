// src/components/dashboard/education-public-article.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Edit, Trash2, Eye, EyeOff, MoreVertical, Calendar, Clock, Tag } from "lucide-react";
import type { EducationPublic } from "@/types/education";
import Image from "next/image";

interface EducationPublicArticleProps {
    article: EducationPublic;
    onEdit: (article: EducationPublic) => void;
    onDelete: (article: EducationPublic) => void;
    onPublishToggle: (article: EducationPublic) => void;
}

export function EducationPublicArticle({
    article,
    onEdit,
    onDelete,
    onPublishToggle
}: EducationPublicArticleProps) {
    // ✅ PERBAIKAN: Handle both Date object and string
    const formatDate = (dateInput: Date | string) => {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const formatReadingTime = (minutes: number | null | undefined) => {
        if (!minutes) return "Belum dihitung";
        return `${minutes} menit baca`;
    };

    return (
        <Card className="group hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg line-clamp-2 leading-tight">
                        {article.title}
                    </CardTitle>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(article)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPublishToggle(article)}>
                                {article.isPublished ? (
                                    <>
                                        <EyeOff className="h-4 w-4 mr-2" />
                                        Unpublish
                                    </>
                                ) : (
                                    <>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Publish
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete(article)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <CardDescription className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(article.createdAt)}
                    </div>
                    {article.readingTime && (
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatReadingTime(article.readingTime)}
                        </div>
                    )}
                </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
                {/* Status Badge */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge variant={article.isPublished ? "default" : "secondary"}>
                        {article.isPublished ? "Published" : "Draft"}
                    </Badge>

                    {/* Tags */}
                    {article.tags && article.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                                {article.tags.slice(0, 2).join(", ")}
                                {article.tags.length > 2 && ` +${article.tags.length - 2}`}
                            </span>
                        </div>
                    )}
                </div>

                {/* Excerpt */}
                {article.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {article.excerpt}
                    </p>
                )}

                {/* Thumbnail Preview */}
                {article.thumbnailUrl && (
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-3">
                        <Image
                            src={article.thumbnailUrl}
                            alt={article.title}
                            className="w-full h-full object-cover"
                            width={640}
                            height={360}
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(article)}
                        className="flex-1"
                    >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                    </Button>
                    <Button
                        variant={article.isPublished ? "outline" : "default"}
                        size="sm"
                        onClick={() => onPublishToggle(article)}
                        className="flex-1"
                    >
                        {article.isPublished ? (
                            <>
                                <EyeOff className="h-4 w-4 mr-1" />
                                Unpublish
                            </>
                        ) : (
                            <>
                                <Eye className="h-4 w-4 mr-1" />
                                Publish
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}