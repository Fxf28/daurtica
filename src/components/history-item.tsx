// components/history-item.tsx
"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Trash2, MoreVertical } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClassificationHistory } from "@/hooks/use-classification-history";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ClassificationResult {
    label: string;
    confidence: number;
}

interface HistoryItemProps {
    item: {
        id: string;
        topLabel: string;
        createdAt: string | Date;
        imageUrl?: string | null;
        confidence: string;
        allResults: ClassificationResult[];
    };
}

export function HistoryItem({ item }: HistoryItemProps) {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const { deleteClassification, isDeleting } = useClassificationHistory();
    const queryClient = useQueryClient();

    // Define a type for classification history item
    interface ClassificationHistoryItem {
        id: string;
        topLabel: string;
        createdAt: string | Date;
        imageUrl?: string | null;
        confidence: string;
        allResults: ClassificationResult[];
    }

    // Define a type for the query data structure
    interface ClassificationHistoryQueryData {
        data: ClassificationHistoryItem[];
        pagination: {
            total: number;
            [key: string]: unknown;
        };
        [key: string]: unknown;
    }

    const handleDelete = async () => {
        try {
            // Optimistic update: langsung hapus dari UI
            queryClient.setQueryData(
                ["classification-history"],
                (oldData: ClassificationHistoryQueryData | undefined) => {
                    if (!oldData?.data) return oldData;

                    return {
                        ...oldData,
                        data: oldData.data.filter((oldItem: ClassificationHistoryItem) => oldItem.id !== item.id),
                        pagination: {
                            ...oldData.pagination,
                            total: oldData.pagination.total - 1
                        }
                    };
                }
            );

            await deleteClassification(item.id);

        } catch (error) {
            // Jika error, kembalikan data ke state semula
            queryClient.invalidateQueries({ queryKey: ["classification-history"] });
            console.error("Failed to delete:", error);
        }
    };

    const confirmDelete = () => {
        toast.custom((t) => (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-4 max-w-sm">
                <p className="font-semibold mb-2">Konfirmasi Hapus</p>
                <p className="text-sm text-muted-foreground mb-4">
                    Apakah Anda yakin ingin menghapus riwayat klasifikasi &quot;{item.topLabel}&quot;?
                </p>
                <div className="flex gap-2 justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.dismiss(t)}
                    >
                        Batal
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                            handleDelete();
                            toast.dismiss(t);
                        }}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Menghapus..." : "Hapus"}
                    </Button>
                </div>
            </div>
        ));
    };

    // Format confidence safely
    const confidencePercent = (() => {
        try {
            const confidenceNum = Number(item.confidence);
            return isNaN(confidenceNum) ? 0 : confidenceNum * 100;
        } catch {
            return 0;
        }
    })();

    // Format date safely
    const formattedDate = (() => {
        try {
            return new Date(item.createdAt).toLocaleString("id-ID", {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return "Tanggal tidak valid";
        }
    })();

    // Filter valid results - Tampilkan semua
    const validResults = item.allResults.filter((result): result is ClassificationResult =>
        result &&
        typeof result.label === 'string' &&
        typeof result.confidence === 'number' &&
        !isNaN(result.confidence)
    );

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3 }}
            layout
            className="h-full"
        >
            <Card className="border border-primary/20 shadow hover:shadow-md transition-shadow h-full flex flex-col group relative">
                {/* Delete Dropdown */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {isDeleting ? "Menghapus..." : "Hapus"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <CardHeader className="p-4 pb-2 pr-12">
                    <CardTitle className="flex justify-between items-start gap-2">
                        <span className="text-sm font-medium line-clamp-2 flex-1">
                            {item.topLabel || "Tidak ada label"}
                        </span>
                        <Badge
                            variant={confidencePercent > 70 ? "default" : confidencePercent > 50 ? "secondary" : "destructive"}
                            className="flex-shrink-0 text-xs whitespace-nowrap"
                        >
                            {confidencePercent.toFixed(1)}%
                        </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                        {formattedDate}
                    </p>
                </CardHeader>

                <CardContent className="p-4 pt-2 flex-1 flex flex-col gap-3">
                    {/* Image Preview */}
                    {item.imageUrl && !imageError ? (
                        <div className="relative aspect-square rounded-lg overflow-hidden mb-1 flex-shrink-0 bg-muted">
                            {imageLoading && (
                                <div className="absolute inset-0 bg-muted animate-pulse" />
                            )}
                            <Image
                                src={item.imageUrl}
                                alt={item.topLabel || "Gambar klasifikasi"}
                                fill
                                className="object-cover transition-opacity duration-300"
                                onLoad={() => setImageLoading(false)}
                                onError={() => {
                                    setImageError(true);
                                    setImageLoading(false);
                                }}
                                style={{
                                    opacity: imageLoading ? 0 : 1
                                }}
                            />
                        </div>
                    ) : (
                        item.imageUrl && (
                            <div className="aspect-square rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                <span className="text-xs text-muted-foreground">Gagal memuat gambar</span>
                            </div>
                        )
                    )}

                    {/* All Results - Tampilkan semua dengan scroll */}
                    {validResults.length > 0 ? (
                        <div className="space-y-1 flex-1">
                            <h4 className="text-xs font-medium text-muted-foreground mb-1">
                                Hasil Detail:
                            </h4>
                            <div className="space-y-1 max-h-20 overflow-y-auto">
                                {validResults.map((result, index) => (
                                    <div key={index} className="flex justify-between items-center text-xs">
                                        <span className="truncate flex-1 mr-2" title={result.label}>
                                            {result.label}
                                        </span>
                                        <span className="text-muted-foreground whitespace-nowrap">
                                            {(result.confidence * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <span className="text-xs text-muted-foreground text-center">
                                Tidak ada data hasil
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}