"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadImage } from "@/components/upload-image";
import { CameraCapture } from "@/components/camera-capture";
import { FramerLazyConfig, M } from "@/components/framer-wrapper";
import { Upload, Camera as CameraIcon } from "lucide-react";

export default function ClassifyPage() {
    // Kita gunakan key untuk memaksa re-mount komponen saat tab berubah
    // Ini memastikan kamera mati saat pindah ke tab upload (hemat baterai/resource)
    const [activeTab, setActiveTab] = useState("upload");

    return (
        <FramerLazyConfig>
            <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/20">
                <main className="flex-1 flex flex-col items-center px-4 sm:px-6 md:px-8 py-8 md:py-12 max-w-5xl mx-auto w-full">

                    <M.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="text-center mb-8 md:mb-12 space-y-3"
                    >
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                            Klasifikasi Sampah AI
                        </h1>
                        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
                            Deteksi jenis sampah secara instan menggunakan AI.
                            <span className="hidden sm:inline"> Pilih metode upload gambar atau gunakan kamera langsung.</span>
                        </p>
                    </M.div>

                    <Tabs
                        defaultValue="upload"
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full max-w-3xl"
                    >
                        <TabsList className="grid w-full grid-cols-2 mb-8 p-1 h-12 bg-muted/50 backdrop-blur-sm">
                            <TabsTrigger value="upload" className="text-base gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Upload className="h-4 w-4" />
                                <span className="hidden sm:inline">Upload Gambar</span>
                                <span className="sm:hidden">Upload</span>
                            </TabsTrigger>
                            <TabsTrigger value="camera" className="text-base gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <CameraIcon className="h-4 w-4" />
                                Kamera
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-2 min-h-[400px]">
                            <TabsContent value="upload" className="mt-0 focus-visible:outline-none">
                                <M.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <UploadImage />
                                </M.div>
                            </TabsContent>

                            <TabsContent value="camera" className="mt-0 focus-visible:outline-none">
                                <M.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {/* Mount kamera hanya saat tab aktif agar tidak berat */}
                                    {activeTab === "camera" && <CameraCapture />}
                                </M.div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </main>
            </div>
        </FramerLazyConfig>
    );
}