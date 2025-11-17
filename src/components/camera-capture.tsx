"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { Camera as CameraIcon, RotateCcw, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useClassification } from "@/hooks/use-classification";
import { useModelStatus } from "@/hooks/use-model-status"; // ✅ IMPORT DISINI
import { ClassificationCard } from "@/components/classification-card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { saveClassification } from "@/lib/api/classification";

export const CameraCapture: React.FC = () => {
    const { user } = useUser();
    const webcamRef = useRef<Webcam>(null);
    const { classifyImage, loading, results } = useClassification();
    const modelStatus = useModelStatus(); // ✅ GUNAKAN DISINI
    const [capturedImage, setCapturedImage] = useState<string>("");
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
    const [imageLoading, setImageLoading] = useState(false);
    const [captureBlob, setCaptureBlob] = useState<Blob | null>(null);

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: facingMode,
    };

    // Auto-save to history when results are available and user is logged in
    useEffect(() => {
        const saveToHistory = async () => {
            if (results.length > 0 && user && captureBlob) {
                try {
                    await saveClassification({
                        imageUrl: capturedImage,
                        topLabel: results[0].label,
                        confidence: results[0].confidence,
                        allResults: results,
                        source: "camera",
                        processingTime: 200,
                        imageSize: captureBlob.size,
                        deviceType: "web"
                    });
                    toast.success("Hasil klasifikasi disimpan ke riwayat");
                } catch (error) {
                    console.error("Failed to save classification:", error);
                    toast.error("Gagal menyimpan ke riwayat");
                }
            }
        };
        saveToHistory();
    }, [results, user, capturedImage, captureBlob]);

    const capture = useCallback(async () => {
        // ✅ Cek status model sebelum capture
        if (modelStatus === "error") {
            toast.error("Model AI tidak tersedia. Silakan refresh halaman.");
            return;
        }

        if (modelStatus === "loading") {
            toast.info("Model AI masih loading, harap tunggu...");
            return;
        }

        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) {
            toast.error("Gagal mengambil gambar");
            return;
        }

        setCapturedImage(imageSrc);
        setImageLoading(true);

        try {
            const response = await fetch(imageSrc);
            const blob = await response.blob();
            setCaptureBlob(blob);
            await classifyImage(blob);
            toast.success("Berhasil mengambil gambar");
        } catch (error) {
            console.error("Capture error:", error);
            toast.error("Gagal memproses gambar");
        }
    }, [classifyImage, modelStatus]); // ✅ Tambah modelStatus ke dependency

    const retake = () => {
        setCapturedImage("");
        setImageLoading(false);
        setCaptureBlob(null);
    };

    const toggleCamera = () => {
        setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    };

    return (
        <div className="min-h-screen bg-muted py-8">
            <div className="max-w-4xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-3xl font-bold text-foreground mb-2">Kamera Klasifikasi</h1>
                    <p className="text-muted-foreground">
                        Gunakan kamera untuk mengklasifikasi sampah secara real-time
                    </p>
                </motion.div>

                {/* ✅ MODEL STATUS INDICATOR - TAMBAHKAN DISINI */}
                {modelStatus === "loading" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                        <div className="flex items-center justify-center space-x-2">
                            <LoadingSpinner size="sm" />
                            <p className="text-blue-800 text-sm">
                                ⚡ Loading AI model... Harap tunggu sebentar
                            </p>
                        </div>
                    </motion.div>
                )}

                {modelStatus === "error" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                        <p className="text-red-800 text-sm">
                            ❌ Gagal memuat model AI. Fitur klasifikasi tidak tersedia.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => window.location.reload()}
                        >
                            Refresh Halaman
                        </Button>
                    </motion.div>
                )}

                <Card className="shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Kamera</span>
                            {modelStatus === "ready" && (
                                <span className="text-sm font-normal text-green-600 flex items-center">
                                    ✅ AI Ready
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!capturedImage ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="relative"
                            >
                                <Webcam
                                    ref={webcamRef}
                                    audio={false}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={videoConstraints}
                                    className="w-full rounded-lg"
                                />

                                {/* Camera Controls */}
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={toggleCamera}
                                        className="rounded-full bg-black/50 text-white hover:bg-black/70"
                                        title="Ganti Kamera"
                                    >
                                        <RotateCcw className="h-5 w-5" />
                                    </Button>

                                    <Button
                                        onClick={capture}
                                        disabled={loading || modelStatus !== "ready"} // ✅ Disable jika model tidak ready
                                        className="rounded-full w-14 h-14 flex items-center justify-center"
                                        title="Ambil Foto"
                                    >
                                        {loading ? <LoadingSpinner size="sm" /> : <CameraIcon className="h-6 w-6" />}
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div className="relative text-center">
                                {imageLoading && (
                                    <Skeleton className="w-full max-w-md h-64 mx-auto rounded-lg mb-4" />
                                )}

                                <Image
                                    src={capturedImage}
                                    alt="Captured"
                                    width={600}
                                    height={400}
                                    className={`w-full max-w-md mx-auto rounded-lg mb-4 transition-opacity duration-500 ${imageLoading ? "opacity-0" : "opacity-100"
                                        }`}
                                    onLoad={() => setImageLoading(false)}
                                />

                                {/* Loading overlay */}
                                {loading && (
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
                                        <LoadingSpinner size="lg" />
                                        <p className="text-white mt-2">Menganalisis gambar...</p>
                                    </div>
                                )}

                                {/* Retake button */}
                                {!loading && (
                                    <Button
                                        onClick={retake}
                                        variant="secondary"
                                        className="flex items-center space-x-2 mx-auto mt-2"
                                    >
                                        <RefreshCcw className="h-4 w-4" />
                                        <span>Ambil Ulang</span>
                                    </Button>
                                )}
                            </motion.div>
                        )}

                        {/* Classification Result */}
                        {results.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="mt-8"
                            >
                                <ClassificationCard
                                    results={results}
                                    onSuggest={() => {
                                        // Handle suggestion feature
                                        toast.info("Fitur saran pengelolaan sampah akan segera hadir");
                                    }}
                                />
                            </motion.div>
                        )}

                        {/* Login Reminder */}
                        {!user && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm"
                            >
                                <p>💡 <strong>Login untuk menyimpan riwayat klasifikasi</strong> - Hasil dari kamera akan otomatis tersimpan di dashboard Anda</p>
                            </motion.div>
                        )}

                        {/* Instructions */}
                        <div className="mt-8 p-4 bg-primary/10 rounded-lg">
                            <h4 className="font-semibold text-primary mb-2">Cara Penggunaan:</h4>
                            <ul className="text-sm text-primary/80 space-y-1 text-left">
                                <li>• Arahkan kamera ke objek sampah</li>
                                <li>• Pastikan objek terlihat jelas dalam frame</li>
                                <li>• Tekan tombol kamera untuk mengambil foto</li>
                                <li>• AI akan mengklasifikasi jenis sampah secara otomatis</li>
                                <li>• Hasil akan ditampilkan di bawah kamera</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};