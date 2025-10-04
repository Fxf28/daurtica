"use client";

import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera as CameraIcon, RotateCcw, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useClassification } from "@/hooks/use-classification";
import { ClassificationCard } from "@/components/classification-card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

export const CameraCapture: React.FC = () => {
    const webcamRef = useRef<Webcam>(null);
    const { classifyImage, loading, results } = useClassification();
    const [capturedImage, setCapturedImage] = useState<string>("");
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
    const [imageLoading, setImageLoading] = useState(false);

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: facingMode,
    };

    const capture = useCallback(async () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) {
            toast.error("Gagal mengambil gambar");
            return;
        } else {
            toast.success("Berhasil mengambil gambar")
        }

        setCapturedImage(imageSrc);
        setImageLoading(true);

        const response = await fetch(imageSrc);
        const blob = await response.blob();

        await classifyImage(blob, "camera", true);
    }, [classifyImage]);

    const retake = () => {
        setCapturedImage("");
        setImageLoading(false);
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

                <Card className="shadow-xl">
                    <CardHeader>
                        <CardTitle>Kamera</CardTitle>
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
                                        disabled={loading}
                                        className="rounded-full w-14 h-14 flex items-center justify-center"
                                        title="Ambil Foto"
                                    >
                                        {loading ? <LoadingSpinner size="sm" /> : <CameraIcon className="h-6 w-6" />}
                                    </Button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className="text-center"
                            >
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
                                    onLoadingComplete={() => setImageLoading(false)}
                                />
                                <Button
                                    onClick={retake}
                                    variant="secondary"
                                    className="flex items-center space-x-2"
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                    <span>Ambil Ulang</span>
                                </Button>
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
                                <ClassificationCard results={results} />
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
