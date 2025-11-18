// app/dashboard/history/page.tsx
"use client";

import { useState, useEffect } from "react";
import { HistoryItem } from "@/components/dashboard/history-item";
import { HistoryPagination } from "@/components/dashboard/history-pagination";
import { useClassificationHistoryList } from "@/hooks/use-classification-history";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";

export default function HistoryPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const initialPage = parseInt(searchParams.get('page') || '1');
    const [currentPage, setCurrentPage] = useState(initialPage);
    const limit = 12;

    const { data, isLoading, error, refetch } = useClassificationHistoryList(currentPage, limit);

    // Sync URL dengan current page
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', currentPage.toString());
        router.push(`?${params.toString()}`, { scroll: false });
    }, [currentPage, router, searchParams]);

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto py-6 px-4">
                <div className="flex justify-center items-center min-h-[400px]">
                    <LoadingSpinner size="lg" />
                    <p className="ml-2 text-muted-foreground">Memuat riwayat...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto py-6 px-4">
                <div className="text-center py-12">
                    <div className="bg-destructive/10 rounded-lg p-8 max-w-md mx-auto">
                        <p className="text-lg text-destructive mb-4">
                            Gagal memuat riwayat klasifikasi.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Silakan refresh halaman atau coba lagi nanti.
                        </p>
                        <Button
                            onClick={() => refetch()}
                            variant="outline"
                            className="mt-4"
                        >
                            Coba Lagi
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const history = data?.data || [];
    const pagination = data?.pagination;

    return (
        <div className="max-w-7xl mx-auto py-6 px-4">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Riwayat Klasifikasi</h1>
                <p className="text-muted-foreground">
                    Lihat semua hasil klasifikasi yang telah Anda lakukan
                </p>
                {history.length > 0 && pagination && (
                    <p className="text-sm text-muted-foreground mt-2">
                        Menampilkan {history.length} dari {pagination.total} item
                    </p>
                )}
            </div>
            {history.length === 0 ? (
                <div className="text-center py-12">
                    <div className="bg-muted/50 rounded-lg p-8 max-w-md mx-auto">
                        <p className="text-lg text-muted-foreground mb-4">
                            Belum ada riwayat klasifikasi.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Mulai dengan mengupload gambar atau menggunakan kamera untuk melihat riwayat di sini.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-8">
                        <AnimatePresence mode="popLayout">
                            {history.map((item) => (
                                <HistoryItem key={item.id} item={item} />
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <HistoryPagination
                            currentPage={currentPage}
                            totalPages={pagination.totalPages}
                            totalItems={pagination.total}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </>
            )}
        </div>
    );
}