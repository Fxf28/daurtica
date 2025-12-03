"use client";

import { useEffect } from "react";
import { UploadImage } from "@/components/upload-image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { loadModel } from "@/lib/classifier-browser";
import { FramerLazyConfig, M } from "@/components/framer-wrapper"; // <-- Tambahkan ini

export default function DashboardUploadPage() {
    // EFFECT: Pemicu Load Model
    useEffect(() => {
        const initModel = async () => {
            try {
                console.log("Dashboard: Triggering model load...");
                await loadModel();
            } catch (error) {
                console.error("Gagal inisialisasi model di dashboard:", error);
            }
        };
        initModel();
    }, []);

    return (
        <FramerLazyConfig> {/* <-- Tambahkan wrapper ini */}
            <div className="flex flex-col min-h-[calc(100vh-4rem)]"> {/* <-- Sesuaikan tinggi */}

                {/* Header Dashboard */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight">Klasifikasi Sampah</h2>
                    <p className="text-muted-foreground">
                        Upload gambar sampah untuk dianalisis oleh AI dan simpan hasilnya ke riwayat Anda.
                    </p>
                </div>

                <Separator className="mb-6" />

                {/* Container Utama */}
                <div className="flex-1 flex flex-col items-center">
                    <div className="w-full max-w-3xl"> {/* <-- Tambahkan width constraint */}
                        <M.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="border-dashed">
                                <CardHeader>
                                    <CardTitle>Upload Gambar</CardTitle>
                                    <CardDescription>
                                        Format yang didukung: JPG, PNG, WebP (Maks. 5MB)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pb-10 flex justify-center">
                                    <div className="w-full max-w-lg"> {/* <-- Kontainer untuk UploadImage */}
                                        <UploadImage />
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