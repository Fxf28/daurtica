"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";
import { toast } from "sonner";
import { EducationPublicArticle } from "@/components/dashboard/education-public-article";
import { EducationPublicForm } from "@/components/dashboard/education-public-form";
import { getEducationPublicList, deleteEducationPublic, togglePublishEducationPublic } from "@/lib/api/education-public";
import type { EducationPublic, EducationPublicListResponse } from "@/types/education";
import { AdminGuard } from "@/components/admin-guard";

export default function EducationAdminPage() {
    const [articles, setArticles] = useState<EducationPublic[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [editingArticle, setEditingArticle] = useState<EducationPublic | null>(null);

    const loadArticles = useCallback(async (page: number = 1) => {
        try {
            setIsLoading(true);
            const filters = {
                page,
                limit: 12,
                search: searchQuery || undefined,
                publishedOnly: statusFilter === "published" ? true : statusFilter === "draft" ? false : undefined,
            };

            const response: EducationPublicListResponse = await getEducationPublicList(filters);
            setArticles(response.data);
            setTotalPages(response.pagination.totalPages);
            setCurrentPage(response.pagination.page);
        } catch (err) {
            console.error("Error loading articles:", err);
            setError(err instanceof Error ? err.message : "Failed to load articles");
            toast.error("Gagal memuat artikel");
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, statusFilter]);

    // Initial load
    useEffect(() => {
        loadArticles();
    }, [loadArticles]);

    // Search and filter
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            loadArticles(1);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, statusFilter, loadArticles]);

    // Handlers
    const handleCreate = () => {
        setEditingArticle(null);
        setShowForm(true);
    };

    const handleEdit = (article: EducationPublic) => {
        setEditingArticle(article);
        setShowForm(true);
    };

    const handleDelete = async (article: EducationPublic) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus artikel "${article.title}"?`)) {
            return;
        }

        try {
            await deleteEducationPublic(article.id);
            toast.success("Artikel berhasil dihapus");
            loadArticles(currentPage);
        } catch (err) {
            console.error("Error deleting article:", err);
            toast.error("Gagal menghapus artikel");
        }
    };

    const handlePublishToggle = async (article: EducationPublic) => {
        try {
            await togglePublishEducationPublic(article.id, !article.isPublished);
            toast.success(`Artikel berhasil ${!article.isPublished ? 'dipublikasikan' : 'disembunyikan'}`);
            loadArticles(currentPage);
        } catch (err) {
            console.error("Error toggling publish status:", err);
            toast.error("Gagal mengubah status artikel");
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingArticle(null);
        loadArticles(currentPage);
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setEditingArticle(null);
    };

    return (
        <AdminGuard>
            <div className="container mx-auto py-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Kelola Artikel Edukasi</h1>
                        <p className="text-muted-foreground">
                            Kelola artikel edukasi publik tentang pengelolaan sampah
                        </p>
                    </div>
                    <Button onClick={handleCreate} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Buat Artikel Baru
                    </Button>
                </div>

                {/* Search and Filter */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari artikel..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Tabs
                                value={statusFilter}
                                onValueChange={(value) => setStatusFilter(value as "all" | "published" | "draft")}
                                className="w-full sm:w-auto"
                            >
                                <TabsList>
                                    <TabsTrigger value="all">Semua</TabsTrigger>
                                    <TabsTrigger value="published">Published</TabsTrigger>
                                    <TabsTrigger value="draft">Draft</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </CardContent>
                </Card>

                {/* Content */}
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Artikel</CardTitle>
                        <CardDescription>
                            {articles.length > 0
                                ? `Menampilkan ${articles.length} artikel`
                                : "Belum ada artikel"
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <LoadingSpinner size="lg" />
                                <span className="ml-2 text-muted-foreground">Memuat artikel...</span>
                            </div>
                        ) : error ? (
                            <div className="text-center py-12">
                                <p className="text-destructive mb-4">{error}</p>
                                <Button onClick={() => loadArticles()}>Coba Lagi</Button>
                            </div>
                        ) : articles.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="bg-muted/50 rounded-lg p-8 max-w-md mx-auto">
                                    <p className="text-lg text-muted-foreground mb-4">
                                        {searchQuery || statusFilter !== "all"
                                            ? "Tidak ada artikel yang sesuai dengan filter"
                                            : "Belum ada artikel edukasi"
                                        }
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {searchQuery || statusFilter !== "all"
                                            ? "Coba ubah pencarian atau filter Anda"
                                            : "Mulai dengan membuat artikel edukasi pertama Anda"
                                        }
                                    </p>
                                    {(searchQuery || statusFilter !== "all") ? (
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setSearchQuery("");
                                                setStatusFilter("all");
                                            }}
                                        >
                                            Reset Filter
                                        </Button>
                                    ) : (
                                        <Button onClick={handleCreate}>
                                            Buat Artikel Pertama
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Articles Grid */}
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {articles.map((article) => (
                                        <EducationPublicArticle
                                            key={article.id}
                                            article={article}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onPublishToggle={handlePublishToggle}
                                        />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center gap-2 mt-8">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => loadArticles(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            Sebelumnya
                                        </Button>

                                        <span className="text-sm text-muted-foreground">
                                            Halaman {currentPage} dari {totalPages}
                                        </span>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => loadArticles(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                        >
                                            Selanjutnya
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Form Modal */}
                {showForm && (
                    <EducationPublicForm
                        article={editingArticle}
                        onSuccess={handleFormSuccess}
                        onCancel={handleFormCancel}
                    />
                )}
            </div>
        </AdminGuard>
    );
}