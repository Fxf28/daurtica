"use client";

import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
// import { Button } from "@/components/ui/button";
import { M } from "./framer-wrapper";
import { useUser } from "@clerk/nextjs";
// import { toast } from "sonner";

type Props = {
    results: {
        label: string;
        confidence: number;
    }[];
    // onSuggest?: () => void;
};

export const ClassificationCard: React.FC<Props> = ({ results }) => {
    // onSuggest
    const { isLoaded } = useUser();
    // const { user, isLoaded } = useUser();

    // const handleSuggestClick = () => {
    //     if (!user) {
    //         toast.error("Silakan login untuk menggunakan fitur ini");
    //         return;
    //     }

    //     if (onSuggest) {
    //         onSuggest();
    //     } else {
    //         toast.info("Fitur saran akan segera tersedia");
    //     }
    // };

    // Show loading state while user auth is being checked
    if (!isLoaded) {
        return (
            <Card className="border border-primary/30 shadow-md">
                <CardHeader>
                    <CardTitle>Hasil Klasifikasi</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                                <div className="h-4 bg-muted rounded animate-pulse"></div>
                                <Progress value={0} className="h-2 bg-muted" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border border-primary/30 shadow-md">
            <CardHeader>
                <CardTitle>Hasil Klasifikasi</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
                {results.map((r, i) => (
                    <M.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.1 }}
                        key={i}
                        className="space-y-1"
                    >
                        <p
                            className={`font-medium ${i === 0 ? "text-primary font-semibold" : "text-foreground"
                                }`}
                        >
                            {r.label} ({(r.confidence * 100).toFixed(2)}%)
                        </p>

                        <Progress
                            value={r.confidence * 100}
                            className={`h-2 ${i === 0
                                ? "[&>div]:bg-primary"
                                : "[&>div]:bg-muted-foreground"
                                }`}
                        />
                    </M.div>
                ))}
            </CardContent>

            <CardFooter className="flex flex-col w-full gap-3">
                {/* Informasi */}
                <p className="text-sm text-muted-foreground w-full">
                    * Persentase menunjukkan tingkat keyakinan model terhadap klasifikasi.
                </p>

                {/* Button untuk saran pengelolaan sampah */}
                {/* <Button
                    onClick={handleSuggestClick}
                    className="w-full"
                    variant="secondary"
                    disabled={!user || !onSuggest}
                >
                    {!user
                        ? "Login untuk Dapatkan Saran"
                        : !onSuggest
                            ? "Fitur Segera Hadir"
                            : "Dapatkan Saran Pengelolaan Sampah"
                    }
                </Button> */}
            </CardFooter>
        </Card>
    );
};