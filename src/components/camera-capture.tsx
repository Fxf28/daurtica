"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { RotateCcw, RefreshCw, XCircle, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClassification } from "@/hooks/use-classification";
import { useModelStatus } from "@/hooks/use-model-status";
import { ClassificationCard } from "@/components/classification-card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { saveClassification } from "@/lib/api/classification";
import Image from "next/image";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { Progress } from "@/components/ui/progress";

export const CameraCapture = () => {
    const { user } = useUser();
    const webcamRef = useRef<Webcam>(null);
    const { classifyImage, results, loading: classificationLoading } = useClassification();
    const modelStatus = useModelStatus();

    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
    const [error, setError] = useState<string | null>(null);
    const [processStep, setProcessStep] = useState<"idle" | "uploading" | "classifying" | "saving" | "complete">("idle");
    const [progress, setProgress] = useState(0);
    const savedRef = useRef(false);

    const isOnline = useOnlineStatus();

    // Config Video
    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: facingMode,
    };

    // Progress simulation - DIPERBAIKI
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (processStep === "uploading") {
            setProgress(0);
            interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 80) {
                        clearInterval(interval);
                        return 80;
                    }
                    return prev + 20;
                });
            }, 100);
        } else if (processStep === "classifying") {
            setProgress(80);
            // Jangan menggunakan interval untuk classifying, tunggu sampai selesai
        } else if (processStep === "saving") {
            setProgress(95);
            setTimeout(() => setProgress(100), 500);
        } else if (processStep === "complete") {
            setProgress(100);
            setTimeout(() => {
                setProcessStep("idle");
                setProgress(0);
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [processStep]);

    // EFFECT BARU: Monitor ketika klasifikasi selesai
    useEffect(() => {
        if (processStep === "classifying" && !classificationLoading && results.length > 0) {
            console.log("Klasifikasi selesai, pindah ke saving");
            setProcessStep("saving");
        }
    }, [processStep, classificationLoading, results]);

    // EFFECT BARU: Handle error klasifikasi
    useEffect(() => {
        if (processStep === "classifying" && !classificationLoading && results.length === 0) {
            console.log("Klasifikasi gagal atau tidak ada hasil");
            toast.error("Klasifikasi gagal atau tidak ada hasil");
            setProcessStep("idle");
        }
    }, [processStep, classificationLoading, results]);

    // Auto-save logic - DIPERBAIKI DENGAN LOGGING
    useEffect(() => {
        const saveToHistory = async () => {
            // Pastikan semua kondisi terpenuhi
            const shouldSave = results.length > 0 &&
                user &&
                capturedImage &&
                processStep === "saving" &&
                !savedRef.current;

            console.log("Auto-save check:", {
                shouldSave,
                hasResults: results.length > 0,
                hasUser: !!user,
                hasImage: !!capturedImage,
                step: processStep,
                alreadySaved: savedRef.current
            });

            if (shouldSave) {
                console.log("Memulai proses penyimpanan kamera...");

                if (!isOnline) {
                    toast.warning("Mode Offline: Hasil diklasifikasi tetapi tidak disimpan ke riwayat.");
                    setProcessStep("complete");
                    return;
                }

                savedRef.current = true;
                try {
                    const res = await fetch(capturedImage);
                    const blob = await res.blob();

                    console.log("Menyimpan klasifikasi...");
                    await saveClassification({
                        imageFile: blob,
                        topLabel: results[0].label,
                        confidence: results[0].confidence,
                        allResults: results,
                        source: "camera",
                        processingTime: 200,
                        imageSize: blob.size,
                        deviceType: "web"
                    });

                    console.log("Penyimpanan berhasil, pindah ke complete");
                    toast.success("Hasil tersimpan di riwayat");
                    setProcessStep("complete");
                } catch (error) {
                    console.error("Save error:", error);
                    toast.error("Gagal menyimpan hasil");
                    setProcessStep("idle");
                }
            } else {
                // Jika tidak memenuhi kondisi shouldSave tapi processStep adalah saving,
                // kita perlu handle kasus ini
                if (processStep === "saving" && !savedRef.current) {
                    console.warn("ProcessStep saving tetapi kondisi tidak terpenuhi, pindah ke complete");
                    setProcessStep("complete");
                }
            }
        };

        saveToHistory();
    }, [results, user, capturedImage, isOnline, processStep]);

    const capture = useCallback(async () => {
        if (modelStatus !== "ready") {
            toast.error("Model AI belum siap");
            return;
        }

        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) {
            toast.error("Gagal mengambil gambar kamera");
            return;
        }

        setCapturedImage(imageSrc);
        savedRef.current = false;
        setProcessStep("uploading");

        try {
            console.log("Memulai proses capture...");
            const res = await fetch(imageSrc);
            const blob = await res.blob();
            const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });

            setProcessStep("classifying");
            console.log("Memulai klasifikasi...");
            await classifyImage(file);
            // classifyImage selesai, effect di atas akan menangani perubahan step

        } catch (error) {
            console.error("Process error:", error);
            toast.error("Gagal memproses gambar");
            setProcessStep("idle");
        }
    }, [classifyImage, modelStatus]);

    const retake = () => {
        setCapturedImage(null);
        savedRef.current = false;
        setError(null);
        setProcessStep("idle");
        setProgress(0);
    };

    const handleCameraError = (err: string | DOMException) => {
        console.error("Camera Error:", err);
        setError("Kamera tidak dapat diakses. Pastikan Anda memberikan izin akses kamera.");
    };

    const getStepIcon = (step: string) => {
        switch (step) {
            case "uploading":
                return <Upload className="h-4 w-4" />;
            case "classifying":
                return <LoadingSpinner size="sm" />;
            case "saving":
                return <LoadingSpinner size="sm" />;
            case "complete":
                return <CheckCircle2 className="h-4 w-4" />;
            default:
                return null;
        }
    };

    const getStepText = (step: string) => {
        switch (step) {
            case "uploading":
                return "Mengupload gambar...";
            case "classifying":
                return "Menganalisis gambar...";
            case "saving":
                return "Menyimpan hasil...";
            case "complete":
                return "Proses selesai!";
            default:
                return "";
        }
    };

    if (error) {
        return (
            <div className="p-8 text-center bg-destructive/10 rounded-xl border border-destructive/20">
                <XCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
                <h3 className="font-semibold text-destructive mb-2">Akses Kamera Ditolak</h3>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline">
                    Coba Lagi
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-lg mx-auto">
            {!isOnline && (
                <div className="mb-4 p-2 bg-amber-100 text-amber-800 text-sm rounded-lg flex items-center justify-center">
                    📡 Anda sedang offline. Fitur klasifikasi tetap berfungsi!
                </div>
            )}

            {/* Progress Indicator */}
            {processStep !== "idle" && (
                <div className="mb-4 p-4 bg-card rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium flex items-center gap-2">
                            {getStepIcon(processStep)}
                            {getStepText(processStep)}
                        </span>
                        <span className="text-xs text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            )}

            {/* Viewport Kamera / Hasil Foto */}
            <div className="relative rounded-xl overflow-hidden bg-black shadow-lg aspect-[4/3] group">
                {!capturedImage ? (
                    <>
                        <Webcam
                            ref={webcamRef}
                            audio={false}
                            screenshotFormat="image/jpeg"
                            videoConstraints={videoConstraints}
                            onUserMediaError={handleCameraError}
                            className="w-full h-full object-cover"
                        />

                        {/* Overlay Controls */}
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6 z-10">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="rounded-full h-10 w-10 bg-white/20 backdrop-blur-md hover:bg-white/40 border-0 text-white"
                                onClick={() => setFacingMode(prev => prev === "user" ? "environment" : "user")}
                                title="Putar Kamera"
                            >
                                <RotateCcw className="h-5 w-5" />
                            </Button>

                            <Button
                                size="icon"
                                className={`rounded-full h-16 w-16 border-4 border-white/50 bg-transparent hover:bg-white/20 transition-all ${classificationLoading || modelStatus !== "ready" ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
                                    }`}
                                onClick={capture}
                                disabled={classificationLoading || modelStatus !== "ready"}
                            >
                                <div className="h-12 w-12 rounded-full bg-white" />
                            </Button>

                            <div className="w-10" />
                        </div>

                        {modelStatus === "loading" && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white text-xs flex items-center gap-2">
                                <LoadingSpinner size="sm" />
                                <span>Menyiapkan AI...</span>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <Image
                            src={capturedImage}
                            alt="Captured"
                            fill
                            className="object-cover"
                        />

                        {/* Processing Overlay */}
                        {processStep !== "idle" && processStep !== "complete" && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                                <LoadingSpinner size="lg" />
                                <p className="mt-3 font-medium animate-pulse">{getStepText(processStep)}</p>
                                <p className="text-sm text-white/70 mt-1">{progress}%</p>
                            </div>
                        )}

                        {/* Retake Button */}
                        {processStep === "idle" && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={retake}
                                className="absolute top-4 right-4 z-20 shadow-lg bg-black/90 hover:bg-black text-white"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Foto Ulang
                            </Button>
                        )}
                    </>
                )}
            </div>

            {/* Hasil Klasifikasi */}
            {processStep === "idle" && results.length > 0 && capturedImage && (
                <div className="mt-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                    <ClassificationCard results={results} />
                </div>
            )}
        </div>
    );
};