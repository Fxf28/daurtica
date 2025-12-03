"use client";

import { useEffect } from "react";
import { CameraCapture } from "@/components/camera-capture";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { loadModel } from "@/lib/classifier-browser";
import { FramerLazyConfig, M } from "@/components/framer-wrapper";

export default function DashboardCameraPage() {
    useEffect(() => {
        const initModel = async () => {
            try {
                console.log("Dashboard Camera: Triggering model load...");
                await loadModel();
            } catch (error) {
                console.error("Gagal inisialisasi model di dashboard camera:", error);
            }
        };
        initModel();
    }, []);

    return (
        <FramerLazyConfig>
            <div className="flex flex-col min-h-[calc(100vh-4rem)]">
                {/* Header Dashboard */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">Klasifikasi Sampah via Kamera</h2>
                    <p className="text-muted-foreground">
                        Ambil gambar sampah menggunakan kamera untuk dianalisis oleh AI dan simpan hasilnya ke riwayat Anda.
                    </p>
                </div>

                <Separator className="mb-6" />

                <div className="flex-1 flex flex-col items-center">
                    <div className="w-full max-w-3xl">
                        <M.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="border-dashed">
                                <CardHeader>
                                    <CardTitle>Kamera</CardTitle>
                                    <CardDescription>
                                        Pastikan kamera diizinkan dan dalam kondisi cahaya yang cukup.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pb-10 flex justify-center">
                                    <div className="w-full max-w-lg">
                                        <CameraCapture />
                                    </div>
                                </CardContent>
                            </Card>
                        </M.div>
                    </div>
                </div>
            </div>
        </FramerLazyConfig>
    );
}