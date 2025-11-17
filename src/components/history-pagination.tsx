// components/history-pagination.tsx
"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface HistoryPaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void; // TAMBAHKAN INI
}

export function HistoryPagination({
    currentPage,
    totalPages,
    totalItems,
    onPageChange // TAMBAHKAN INI
}: HistoryPaginationProps) {
    const handlePageChange = (pageNumber: number) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        onPageChange(pageNumber); // GUNAKAN onPageChange DARI PROPS
    };

    // Generate page numbers to display
    const getPageNumbers = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (
            let i = Math.max(2, currentPage - delta);
            i <= Math.min(totalPages - 1, currentPage + delta);
            i++
        ) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages);
        } else {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t">
            {/* Info */}
            <div className="text-sm text-muted-foreground">
                Menampilkan halaman {currentPage} dari {totalPages} ({totalItems} total item)
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center space-x-1">
                {/* Previous Button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-9 w-9 p-0"
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Halaman sebelumnya</span>
                </Button>

                {/* Page Numbers */}
                {getPageNumbers().map((page, index) => {
                    if (page === '...') {
                        return (
                            <Button
                                key={`dots-${index}`}
                                variant="outline"
                                size="sm"
                                className="h-9 w-9 p-0"
                                disabled
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        );
                    }

                    const pageNumber = page as number;
                    return (
                        <Button
                            key={pageNumber}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNumber)}
                            className="h-9 w-9 p-0"
                        >
                            {pageNumber}
                        </Button>
                    );
                })}

                {/* Next Button */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-9 w-9 p-0"
                >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Halaman berikutnya</span>
                </Button>
            </div>

            {/* Quick Navigation */}
            <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Lompat ke:</span>
                <select
                    value={currentPage}
                    onChange={(e) => handlePageChange(Number(e.target.value))}
                    className="border rounded px-2 py-1 text-sm bg-background"
                >
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <option key={page} value={page}>
                            Halaman {page}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}