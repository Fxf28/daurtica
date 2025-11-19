// src/components/dashboard/education-personal-list.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getEducationPersonalList, getEducationPersonalUsage } from "@/lib/api/education-personal";
import type { EducationPersonal } from "@/types/education";
import { RefreshCw, Plus, AlertCircle } from "lucide-react";
import { EducationPersonalItem } from "./education-personal-item";
import { TestEducationGenerate } from "@/components/test-education-generate";
import { Badge } from "@/components/ui/badge";

interface UsageInfo {
    current: number;
    limit: number;
    remaining: number;
}

export function EducationPersonalList() {
    const [articles, setArticles] = useState<EducationPersonal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showGenerator, setShowGenerator] = useState(false);
    const [newlyGeneratedId, setNewlyGeneratedId] = useState<string | null>(null);
    const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);

    const loadArticles = async () => {
        try {
            setLoading(true);
            const response = await getEducationPersonalList({ limit: 50 });
            setArticles(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load articles");
            console.error("Error loading articles:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadUsageInfo = async () => {
        try {
            const usage = await getEducationPersonalUsage();
            setUsageInfo(usage);
        } catch (error) {
            console.error("Failed to load usage info:", error);
        }
    };

    useEffect(() => {
        loadArticles();
        loadUsageInfo();
    }, []);

    // Auto-refresh ketika ada newlyGeneratedId berubah
    useEffect(() => {
        if (newlyGeneratedId) {
            // Refresh articles untuk mendapatkan data terbaru
            loadArticles();
            // Refresh usage info
            loadUsageInfo();
            setNewlyGeneratedId(null);
        }
    }, [newlyGeneratedId]);

    // Function untuk menambah artikel baru ke list tanpa refresh
    const addNewArticle = (newArticle: EducationPersonal) => {
        setArticles(prev => [newArticle, ...prev]);
    };

    // Function untuk update artikel yang sudah ada
    const updateArticle = (updatedArticle: EducationPersonal) => {
        setArticles(prev => prev.map(article =>
            article.id === updatedArticle.id ? updatedArticle : article
        ));
    };

    if (loading && articles.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex justify-center items-center py-12">
                        <RefreshCw className="h-6 w-6 animate-spin mr-3" />
                        <span className="text-muted-foreground">Memuat artikel...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header dengan Usage Info */}
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="text-xl sm:text-2xl">Education Personal Saya</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Konten edukasi yang digenerate khusus untuk Anda
                        </p>

                        {/* Usage Info Badge */}
                        {usageInfo && (
                            <div className="flex items-center gap-2 mt-2">
                                <Badge
                                    variant={
                                        usageInfo.remaining === 0 ? "destructive" :
                                            usageInfo.remaining <= 2 ? "default" : "secondary"
                                    }
                                    className="text-xs"
                                >
                                    {usageInfo.remaining === 0 ? (
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                    ) : null}
                                    Sisa Generate: {usageInfo.remaining}/{usageInfo.limit}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    Reset: 00:00 WIB
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button
                            onClick={() => {
                                loadArticles();
                                loadUsageInfo();
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-none"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                        <Button
                            onClick={() => setShowGenerator(!showGenerator)}
                            size="sm"
                            className="flex-1 sm:flex-none"
                            disabled={usageInfo?.remaining === 0}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {showGenerator ? "Tutup Generator" : "Generate Baru"}
                        </Button>
                    </div>
                </CardHeader>
            </Card>

            {/* Generator Section */}
            {showGenerator && (
                <TestEducationGenerate
                    onGenerateSuccess={(articleId) => setNewlyGeneratedId(articleId)}
                    onNewArticleCreated={addNewArticle}
                />
            )}

            {/* Articles Grid */}
            <Card>
                <CardContent className="pt-6">
                    {error ? (
                        <div className="text-center py-8">
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md mx-auto">
                                <p className="text-destructive font-medium mb-2">Error</p>
                                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                                <Button onClick={loadArticles} variant="outline" size="sm">
                                    Coba Lagi
                                </Button>
                            </div>
                        </div>
                    ) : articles.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="bg-muted/30 rounded-xl p-8 max-w-md mx-auto">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Plus className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Belum ada konten edukasi</h3>
                                <p className="text-muted-foreground mb-6">
                                    Mulai dengan generate konten edukasi pertama Anda tentang pengelolaan sampah
                                </p>
                                <Button
                                    onClick={() => setShowGenerator(true)}
                                    className="w-full"
                                    size="lg"
                                    disabled={usageInfo?.remaining === 0}
                                >
                                    <Plus className="h-5 w-5 mr-2" />
                                    {usageInfo?.remaining === 0 ? "Batas Generate Habis" : "Generate Konten Pertama"}
                                </Button>

                                {usageInfo?.remaining === 0 && (
                                    <p className="text-xs text-muted-foreground mt-3">
                                        Limit generate akan direset besok pukul 00:00 WIB
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <div className="text-sm text-muted-foreground">
                                    Menampilkan {articles.length} artikel
                                    {usageInfo && (
                                        <span className="ml-2">
                                            • Sisa generate: <strong>{usageInfo.remaining}</strong>/{usageInfo.limit}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground hidden sm:block">
                                    Klik kartu untuk membaca detail
                                </div>
                            </div>

                            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                                {articles.map((article) => (
                                    <EducationPersonalItem
                                        key={article.id}
                                        article={article}
                                        onUpdate={loadArticles}
                                        onArticleUpdated={updateArticle}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}