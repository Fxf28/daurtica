"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

type Props = {
    results: {
        label: string;
        confidence: number;
    }[];
};

export const ClassificationCard: React.FC<Props> = ({ results }) => {
    return (
        <Card className="border border-primary/30 shadow-md">
            <CardHeader>
                <CardTitle>Hasil Klasifikasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {results.map((r, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        key={i} className="space-y-1"
                    >
                        <p
                            className={`font-medium ${i === 0 ? "text-primary font-semibold" : "text-foreground"
                                }`}
                        >
                            {r.label} ({(r.confidence * 100).toFixed(2)}%)
                        </p>

                        <Progress
                            value={r.confidence * 100}
                            className={`h-2 ${i === 0 ? "[&>div]:bg-primary" : "[&>div]:bg-muted-foreground"}`}
                        />
                    </motion.div>
                ))}
            </CardContent>
        </Card>
    );
};
