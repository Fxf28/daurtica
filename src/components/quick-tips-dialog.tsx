"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Leaf, Info, Recycle, TriangleAlert, Archive } from "lucide-react";
import { useQuickTips } from "@/hooks/use-quick-tips";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    label: string | null;
};

export const QuickTipsDialog: React.FC<Props> = ({ open, onOpenChange, label }) => {
    // Hook dipindah ke sini. 
    // Saat loading/data berubah, HANYA komponen ini yang re-render.
    const { data: tipData, isLoading, isError } = useQuickTips(label, open);

    const formatLabel = (text: string) => {
        return text.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    };

    const getCategoryStyle = (category: string = "") => {
        const cat = category.toLowerCase();
        if (cat.includes("organik") && !cat.includes("an")) return { icon: <Leaf className="w-5 h-5 text-green-600" />, bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" };
        if (cat.includes("b3") || cat.includes("berbahaya")) return { icon: <TriangleAlert className="w-5 h-5 text-red-600" />, bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" };
        if (cat.includes("residu")) return { icon: <Archive className="w-5 h-5 text-gray-600" />, bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-400" };
        return { icon: <Recycle className="w-5 h-5 text-blue-600" />, bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400" };
    };

    const categoryStyle = tipData ? getCategoryStyle(tipData.category) : getCategoryStyle("");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto w-[95%] rounded-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="w-5 h-5 text-emerald-600" />
                        Saran Pengelolaan
                    </DialogTitle>
                    <DialogDescription>AI menganalisis jenis sampah ini.</DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-200 rounded-full blur animate-pulse opacity-50"></div>
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 relative z-10" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground animate-pulse">Sedang mencari panduan...</p>
                    </div>
                ) : isError ? (
                    <div className="py-6 text-center space-y-2">
                        <p className="text-red-500 text-sm">Gagal memuat saran.</p>
                        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Refresh</Button>
                    </div>
                ) : tipData ? (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        {/* Header Card */}
                        <div className="flex flex-col gap-2 p-3 rounded-lg border bg-card shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-foreground capitalize leading-tight">{tipData.title}</h3>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">Terdeteksi: {formatLabel(label || "")}</p>
                                </div>
                                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border ${categoryStyle.bg} ${categoryStyle.text}`}>
                                    {categoryStyle.icon}
                                    {tipData.category.toUpperCase()}
                                </div>
                            </div>
                            <div className="pt-2 border-t mt-1">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Rekomendasi:</span>
                                <p className="font-semibold text-foreground text-sm flex items-center gap-2 mt-0.5">{tipData.action}</p>
                            </div>
                        </div>

                        {/* Tips List */}
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <Leaf className="w-4 h-4 text-emerald-600" /> Langkah Pengelolaan
                            </h4>
                            <ul className="space-y-2">
                                {tipData.tips.map((tip, idx) => (
                                    <li key={idx} className="flex gap-2.5 text-sm items-start">
                                        <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold mt-0.5">{idx + 1}</span>
                                        <span className="text-muted-foreground leading-snug">{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Fun Fact */}
                        {tipData.funFact && (
                            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 p-3 rounded-lg flex gap-3 items-start">
                                <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400">Tahukah Kamu?</p>
                                    <p className="text-xs text-blue-600/90 dark:text-blue-300 leading-snug">{tipData.funFact}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
};