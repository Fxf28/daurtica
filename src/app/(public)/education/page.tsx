// src/app/(public)/education/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Calendar, Clock, Tag, Eye } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { getEducationPublicList } from "@/lib/api/education-public"
import type { EducationPublic } from "@/types/education"
import Image from "next/image"
import Link from "next/link" // ✅ TAMBAHKAN IMPORT INI

export default function EducationPage() {
    const [articles, setArticles] = useState<EducationPublic[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    const loadArticles = useCallback(async () => {
        try {
            setIsLoading(true)
            const response = await getEducationPublicList({
                publishedOnly: true,
                search: searchQuery || undefined,
                limit: 50
            })
            setArticles(response.data)
        } catch (err) {
            console.error("Error loading articles:", err)
            setError(err instanceof Error ? err.message : "Failed to load articles")
        } finally {
            setIsLoading(false)
        }
    }, [searchQuery])

    // Initial load
    useEffect(() => {
        loadArticles()
    }, [loadArticles])

    // Search with debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadArticles()
        }, 500)

        return () => clearTimeout(timeoutId)
    }, [searchQuery, loadArticles])

    const formatDate = (dateInput: Date | string) => {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
        return date.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
        })
    }

    const formatReadingTime = (minutes: number | null | undefined) => {
        if (!minutes) return "Belum dihitung"
        return `${minutes} menit baca`
    }

    const renderPlainTextPreview = (content: string, maxLength: number = 150) => {
        const plainText = content
            .replace(/#{1,6}\s?/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
            .replace(/\n/g, ' ')
            .trim()

        if (plainText.length <= maxLength) {
            return plainText
        }

        return plainText.substring(0, maxLength).trim() + "..."
    }

    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1 px-6 sm:px-12 md:px-20 py-12">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                        Edukasi Pengelolaan Sampah
                    </h1>
                    <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
                        Tingkatkan kesadaran tentang pengelolaan sampah dan daur ulang melalui
                        artikel edukasi dari para ahli.
                    </p>
                </motion.div>

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="max-w-2xl mx-auto mb-12"
                >
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Cari artikel edukasi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 text-lg py-6"
                        />
                    </div>
                </motion.div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                        <LoadingSpinner size="lg" />
                        <span className="ml-2 text-muted-foreground">Memuat artikel...</span>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-destructive mb-4">{error}</p>
                                <Button onClick={loadArticles}>Coba Lagi</Button>
                            </CardContent>
                        </Card>
                    </div>
                ) : articles.length === 0 ? (
                    <div className="text-center py-12">
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-muted-foreground mb-4">
                                    {searchQuery
                                        ? "Tidak ada artikel yang sesuai dengan pencarian"
                                        : "Belum ada artikel edukasi yang tersedia"
                                    }
                                </p>
                                {searchQuery && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setSearchQuery("")}
                                    >
                                        Tampilkan Semua Artikel
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <>
                        {/* Articles Count */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="text-center mb-8"
                        >
                            <p className="text-muted-foreground">
                                Menampilkan {articles.length} artikel edukasi
                            </p>
                        </motion.div>

                        {/* Articles Grid */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {articles.map((article, index) => (
                                <motion.div
                                    key={article.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                >
                                    <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group">
                                        {/* Thumbnail */}
                                        {article.thumbnailUrl && (
                                            <div className="aspect-video overflow-hidden rounded-t-lg">
                                                <Image
                                                    src={article.thumbnailUrl}
                                                    alt={article.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    width={400}
                                                    height={225}
                                                />
                                            </div>
                                        )}

                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-lg line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                                                {article.title}
                                            </CardTitle>

                                            <CardDescription className="flex flex-wrap items-center gap-3 text-sm">
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

                                        <CardContent className="pb-3">
                                            {/* Tags */}
                                            {article.tags && article.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {article.tags.slice(0, 3).map((tag) => (
                                                        <Badge key={tag} variant="secondary" className="text-xs">
                                                            <Tag className="h-3 w-3 mr-1" />
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    {article.tags.length > 3 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{article.tags.length - 3}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}

                                            {/* Excerpt/Preview */}
                                            {article.excerpt ? (
                                                <p className="text-sm text-muted-foreground line-clamp-3">
                                                    {article.excerpt}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground line-clamp-3">
                                                    {renderPlainTextPreview(article.content)}
                                                </p>
                                            )}
                                        </CardContent>

                                        <CardFooter className="pt-0">
                                            {/* ✅ UBAH: Gunakan Link untuk navigasi ke halaman detail */}
                                            <Link href={`/education/${article.slug}`} className="w-full">
                                                <Button variant="ghost" size="sm" className="w-full group-hover:bg-primary/10">
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Baca Selengkapnya
                                                </Button>
                                            </Link>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}