"use client"

import { useState, useEffect, useCallback } from "react"
import { FramerLazyConfig, M } from "@/components/framer-wrapper"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Calendar, Clock, Tag, Eye } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { getEducationPublicList } from "@/lib/api/education-public"
import type { EducationPublic } from "@/types/education"
import Image from "next/image"
import Link from "next/link"
import { useOnlineStatus } from "@/hooks/use-online-status";

export default function EducationPage() {
    const [articles, setArticles] = useState<EducationPublic[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")

    const isOnline = useOnlineStatus();

    const loadArticles = useCallback(async () => {
        try {
            setIsLoading(true)
            if (!isOnline && articles.length > 0) {
                setError("Mode offline aktif. Tidak ada update terbaru.");
                setIsLoading(false);
                return;
            }


            const response = await getEducationPublicList({
                publishedOnly: true,
                search: searchQuery || undefined,
                limit: 50
            })
            setArticles(response.data)
            setError(null)
        } catch (err) {
            console.error("Error loading articles:", err)

            // Periksa apakah error terjadi karena "Network Error" dan tidak ada cache.
            if (!isOnline && articles.length === 0) {
                setError("Anda sedang Offline dan belum ada artikel tersimpan di perangkat. Silakan coba kembali saat online.");
            } else {
                setError("Gagal memuat artikel. Silakan refresh.");
            }
        } finally {
            setIsLoading(false)
        }
    }, [searchQuery, isOnline, articles.length])

    useEffect(() => {
        loadArticles()
    }, [loadArticles])

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadArticles()
        }, 500)
        return () => clearTimeout(timeoutId)
    }, [searchQuery, loadArticles])

    const formatDate = (dateInput: Date | string) => {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
        return date.toLocaleDateString("id-ID", {
            day: "numeric", month: "long", year: "numeric"
        })
    }

    const formatReadingTime = (minutes: number | null | undefined) => {
        if (!minutes) return "Belum dihitung"
        return `${minutes} menit baca`
    }

    const renderPlainTextPreview = (content: string | undefined, maxLength: number = 150) => {
        if (!content) return "";
        const plainText = content
            .replace(/#{1,6}\s?/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
            .replace(/\n/g, ' ')
            .trim()

        return plainText.length <= maxLength ? plainText : plainText.substring(0, maxLength).trim() + "..."
    }

    return (
        // Bungkus dengan FramerLazyConfig untuk mengaktifkan mode ringan
        <FramerLazyConfig>
            <div className="flex flex-col min-h-screen">
                <main className="flex-1 px-6 sm:px-12 md:px-20 py-12">
                    {!isOnline && (
                        <div className="text-center mb-4">
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Mode Offline: Menampilkan artikel yang tersimpan
                            </Badge>
                        </div>
                    )}
                    {/* Header: Gunakan M.div (Lazy Motion) */}
                    <M.div
                        initial={{ opacity: 0, y: -10 }} // Kurangi jarak Y agar repaint lebih sedikit
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }} // Percepat durasi
                        className="text-center mb-12"
                    >
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground text-balance">
                            Edukasi Pengelolaan Sampah
                        </h1>
                        <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto text-balance">
                            Tingkatkan kesadaran tentang pengelolaan sampah dan daur ulang melalui
                            artikel edukasi dari para ahli.
                        </p>
                    </M.div>

                    <div className="max-w-2xl mx-auto mb-12">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Cari artikel edukasi..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 text-lg py-6"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <LoadingSpinner size="lg" />
                            <span className="ml-2 text-muted-foreground">Memuat artikel...</span>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <Card><CardContent className="pt-6"><p className="text-destructive mb-4">{error}</p><Button onClick={loadArticles}>Coba Lagi</Button></CardContent></Card>
                        </div>
                    ) : articles.length === 0 ? (
                        <div className="text-center py-12">
                            <Card><CardContent className="pt-6"><p className="text-muted-foreground mb-4">Tidak ada artikel ditemukan.</p></CardContent></Card>
                        </div>
                    ) : (
                        <>
                            <M.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.4 }}
                                className="text-center mb-8"
                            >
                                <p className="text-muted-foreground">
                                    Menampilkan {articles.length} artikel edukasi
                                </p>
                            </M.div>

                            {/* Articles Grid */}
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 content-visibility-auto">
                                {articles.map((article, index) => (
                                    <M.div
                                        key={article.id}
                                        initial={{ opacity: 0, scale: 0.95 }} // Scale kecil lebih ringan daripada Y translate
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }} // Cap delay max 0.5s agar user tidak menunggu lama
                                        className="h-full" // Pastikan height full
                                    >
                                        <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-primary/50 group flex flex-col">
                                            {article.thumbnailUrl && (
                                                <div className="aspect-video overflow-hidden rounded-t-lg bg-muted relative">
                                                    <Image
                                                        src={article.thumbnailUrl}
                                                        alt={article.title}
                                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                        fill
                                                        // 🚀 OPTIMASI GAMBAR WAJIB:
                                                        // 1. Sizes: Memberi tahu browser ukuran gambar di berbagai layar
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                        // 2. Loading: Eager untuk 6 gambar pertama (above fold), Lazy untuk sisanya
                                                        loading={index < 6 ? "eager" : "lazy"}
                                                        // 3. Quality: Turunkan sedikit untuk thumbnail
                                                        quality={75}
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

                                            <CardContent className="pb-3 flex-1">
                                                {article.tags && article.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                        {article.tags.slice(0, 3).map((tag) => (
                                                            <Badge key={tag} variant="secondary" className="text-xs">
                                                                <Tag className="h-3 w-3 mr-1" />
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                                <p className="text-sm text-muted-foreground line-clamp-3">
                                                    {article.excerpt || renderPlainTextPreview(article.content)}
                                                </p>
                                            </CardContent>

                                            <CardFooter className="pt-0 mt-auto">
                                                <Link href={`/education/${article.slug}`} className="w-full">
                                                    <Button variant="ghost" size="sm" className="w-full group-hover:bg-primary/10">
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Baca Selengkapnya
                                                    </Button>
                                                </Link>
                                            </CardFooter>
                                        </Card>
                                    </M.div>
                                ))}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </FramerLazyConfig>
    )
}