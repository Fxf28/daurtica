"use client";

import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { M } from "./framer-wrapper";
import { useUser } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
// Import komponen dialog yang baru dibuat
import { QuickTipsDialog } from "./quick-tips-dialog";

type Props = {
    results: {
        label: string;
        confidence: number;
    }[];
};

export const ClassificationCard: React.FC<Props> = ({ results }) => {
    const { isLoaded } = useUser();
    const [isOpen, setIsOpen] = useState(false);

    // Kita tidak memanggil hook useQuickTips di sini lagi!
    // Ini mencegah parent re-render saat loading spinner berputar.

    const topLabel = results.length > 0 ? results[0].label : null;

    const formatLabel = (label: string) => {
        return label.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    };

    // Skeleton Loading
    if (!isLoaded) return (
        <div className="w-full max-w-sm mx-auto h-48 bg-muted animate-pulse rounded-xl border border-primary/20" />
    );

    return (
        <>
            <Card className="w-full max-w-sm mx-auto border border-primary/30 shadow-lg relative z-10 bg-card/95 backdrop-blur-sm">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Hasil Klasifikasi</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {results.map((r, i) => (
                        <M.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: i * 0.1 }}
                            className="space-y-1.5"
                        >
                            <div className="flex justify-between items-center">
                                <p className={`text-sm font-medium ${i === 0 ? "text-primary font-semibold text-base" : "text-foreground"}`}>
                                    {formatLabel(r.label)}
                                </p>
                                <span className="text-xs text-muted-foreground">{(r.confidence * 100).toFixed(1)}%</span>
                            </div>
                            <Progress value={r.confidence * 100} className={`h-1.5 ${i === 0 ? "[&>div]:bg-primary" : "[&>div]:bg-muted-foreground"}`} />
                        </M.div>
                    ))}
                </CardContent>

                <CardFooter className="flex flex-col w-full gap-3 pt-2">
                    <p className="text-[10px] text-muted-foreground w-full text-center">*Hasil klasifikasi berdasarkan model AI.</p>

                    <Button
                        onClick={() => setIsOpen(true)}
                        className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 shadow-sm transition-all active:scale-95 h-9 text-sm"
                        disabled={results.length === 0}
                    >
                        <Sparkles className="w-4 h-4" />
                        Saran Pengelolaan
                    </Button>
                </CardFooter>
            </Card>

            {/* Panggil komponen Dialog yang terpisah */}
            <QuickTipsDialog
                open={isOpen}
                onOpenChange={setIsOpen}
                label={topLabel}
            />
        </>
    );
};