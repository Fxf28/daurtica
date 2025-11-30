"use client";

import { useState, useRef, useEffect, DragEvent } from "react";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { Upload, X, ImageIcon, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useClassification } from "@/hooks/use-classification";
import { useModelStatus } from "@/hooks/use-model-status";
import { ClassificationCard } from "@/components/classification-card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { saveClassification } from "@/lib/api/classification";
import { Button } from "@/components/ui/button";
import { M } from "./framer-wrapper";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { Progress } from "@/components/ui/progress";

export const UploadImage = () => {
    const { user } = useUser();
    const { classifyImage, results, loading: classificationLoading } = useClassification();
    const modelStatus = useModelStatus();

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [currentFile, setCurrentFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [processStep, setProcessStep] = useState<"idle" | "uploading" | "classifying" | "saving" | "complete">("idle");
    const [progress, setProgress] = useState(0);

    const savedRef = useRef(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const isOnline = useOnlineStatus();

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
            // Klasifikasi selesai, lanjut ke saving
            setProcessStep("saving");
        }
    }, [processStep, classificationLoading, results]);

    // EFFECT BARU: Handle error klasifikasi
    useEffect(() => {
        if (processStep === "classifying" && !classificationLoading && results.length === 0) {
            // Klasifikasi gagal atau tidak ada hasil
            toast.error("Klasifikasi gagal atau tidak ada hasil");
            setProcessStep("idle");
        }
    }, [processStep, classificationLoading, results]);

    // Fungsi validasi & proses file - DIPERBAIKI
    const processFile = async (file: File) => {
        if (modelStatus === "error") {
            toast.error("Model AI tidak tersedia. Silakan refresh halaman.");
            return;
        }
        if (modelStatus === "loading") {
            toast.info("Model AI masih loading, harap tunggu...");
            return;
        }
        if (!file.type.startsWith("image/")) {
            toast.error("File harus berupa gambar (JPG/PNG)");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Ukuran file terlalu besar (maks 5MB)");
            return;
        }

        setProcessStep("uploading");
        setCurrentFile(file);
        savedRef.current = false;

        // Reset results sebelumnya jika ada
        // Note: Anda mungkin perlu menambahkan method reset di useClassification hook

        const reader = new FileReader();
        reader.onloadstart = () => {
            setImageLoading(true);
        };
        reader.onload = () => {
            setSelectedImage(reader.result as string);
            setImageLoading(false);
        };
        reader.readAsDataURL(file);

        try {
            setProcessStep("classifying");
            await classifyImage(file);
            // classifyImage selesai, effect di atas akan menangani perubahan step
        } catch (err) {
            console.error(err);
            toast.error("Gagal mengklasifikasi gambar");
            setProcessStep("idle");
        }
    };

    // Handler Drag & Drop
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const resetUpload = () => {
        setSelectedImage(null);
        setCurrentFile(null);
        setImageLoading(false);
        savedRef.current = false;
        setProcessStep("idle");
        setProgress(0);
        if (inputRef.current) inputRef.current.value = "";
    };

    // Auto-save logic - DIPERBAIKI
    useEffect(() => {
        const saveToHistory = async () => {
            // Pastikan semua kondisi terpenuhi
            const shouldSave = results.length > 0 &&
                currentFile &&
                processStep === "saving" &&
                !savedRef.current;

            if (shouldSave) {
                console.log("Memulai proses penyimpanan...", {
                    hasResults: results.length > 0,
                    hasFile: !!currentFile,
                    step: processStep,
                    alreadySaved: savedRef.current
                });

                if (!user) {
                    toast.info("Login untuk menyimpan hasil ke riwayat");
                    setProcessStep("complete");
                    return;
                }

                if (!isOnline) {
                    toast.warning("Mode Offline: Hasil diklasifikasi tetapi tidak disimpan ke riwayat.");
                    setProcessStep("complete");
                    return;
                }

                savedRef.current = true;
                try {
                    await saveClassification({
                        imageFile: currentFile,
                        topLabel: results[0].label,
                        confidence: results[0].confidence,
                        allResults: results,
                        source: "upload",
                        processingTime: 150,
                        imageSize: currentFile.size,
                        deviceType: "web"
                    });
                    toast.success("Hasil tersimpan di riwayat");
                    setProcessStep("complete");
                } catch (error) {
                    console.error("Failed to save:", error);
                    toast.error("Gagal menyimpan hasil");
                    setProcessStep("idle");
                }
            }
        };
        saveToHistory();
    }, [results, user, currentFile, isOnline, processStep]); // Tambah processStep ke dependency

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

    return (
        <div className="flex flex-col items-center w-full">
            {!isOnline && (
                <div className="mb-4 p-2 bg-amber-100 text-amber-800 text-sm rounded-lg flex items-center justify-center">
                    📡 Anda sedang offline. Fitur klasifikasi tetap berfungsi!
                </div>
            )}

            {/* Process Progress Indicator */}
            {processStep !== "idle" && (
                <M.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 w-full max-w-lg"
                >
                    <div className="p-4 bg-card rounded-lg border shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium flex items-center gap-2">
                                {getStepIcon(processStep)}
                                {getStepText(processStep)}
                            </span>
                            <span className="text-xs text-muted-foreground">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                </M.div>
            )}

            {/* Model Loading Status */}
            <AnimatePresence>
                {modelStatus === "loading" && (
                    <M.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 w-full max-w-lg"
                    >
                        <div className="flex items-center justify-center p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-blue-700 text-sm">
                            <LoadingSpinner size="sm" className="mr-2" />
                            Memuat model AI...
                        </div>
                    </M.div>
                )}
            </AnimatePresence>

            {/* Upload Area (Dengan Drag & Drop) */}
            {!selectedImage ? (
                <M.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`w-full max-w-lg border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer relative group
                        ${isDragging
                            ? "border-primary bg-primary/5 scale-[1.02]"
                            : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30"
                        }
                        ${modelStatus !== "ready" ? "opacity-50 pointer-events-none" : ""}
                    `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className={`p-4 rounded-full bg-muted transition-colors group-hover:bg-primary/10 ${isDragging ? "bg-primary/20" : ""}`}>
                            <Upload className={`h-8 w-8 text-muted-foreground group-hover:text-primary ${isDragging ? "text-primary" : ""}`} />
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium text-foreground">
                                {isDragging ? "Lepaskan gambar di sini" : "Klik atau seret gambar ke sini"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                JPG, PNG, WebP (Max 5MB)
                            </p>
                        </div>
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={modelStatus !== "ready"}
                    />
                </M.div>
            ) : (
                /* Preview & Result View */
                <M.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-lg space-y-6"
                >
                    <div className="relative rounded-xl overflow-hidden border shadow-sm bg-card">
                        <div className="relative aspect-video w-full bg-muted">
                            {imageLoading && <Skeleton className="absolute inset-0" />}
                            <Image
                                src={selectedImage}
                                alt="Preview sampah"
                                fill
                                className={`object-contain transition-opacity duration-300 ${imageLoading ? "opacity-0" : "opacity-100"}`}
                                onLoad={() => setImageLoading(false)}
                            />

                            {/* Process Overlay */}
                            {processStep !== "idle" && processStep !== "complete" && (
                                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                    <LoadingSpinner size="lg" />
                                    <p className="text-sm font-medium mt-3 animate-pulse">{getStepText(processStep)}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
                                </div>
                            )}

                            {/* Reset Button (Overlay) */}
                            {processStep === "idle" && (
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={resetUpload}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Results */}
                    {processStep === "idle" && results.length > 0 && (
                        <M.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <ClassificationCard results={results} />

                            <div className="mt-4 flex justify-center">
                                <Button variant="outline" onClick={resetUpload} className="text-muted-foreground hover:text-foreground">
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                    Klasifikasi Gambar Lain
                                </Button>
                            </div>
                        </M.div>
                    )}
                </M.div>
            )}
        </div>
    );
};