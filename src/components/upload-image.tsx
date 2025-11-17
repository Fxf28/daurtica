"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useClassification } from "@/hooks/use-classification";
import { useModelStatus } from "@/hooks/use-model-status"; // ✅ IMPORT DISINI
import { ClassificationCard } from "@/components/classification-card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { saveClassification } from "@/lib/api/classification";

export const UploadImage = () => {
    const { user } = useUser();
    const { classifyImage, loading, results } = useClassification();
    const modelStatus = useModelStatus(); // ✅ GUNAKAN DISINI
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [currentFile, setCurrentFile] = useState<File | null>(null);

    const handleFile = async (file: File) => {
        // ✅ Cek status model sebelum proses
        if (modelStatus === "error") {
            toast.error("Model AI tidak tersedia. Silakan refresh halaman.");
            return;
        }

        if (modelStatus === "loading") {
            toast.info("Model AI masih loading, harap tunggu...");
            return;
        }

        if (!file.type.startsWith("image/")) {
            toast.error("File yang dipilih bukan gambar");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Ukuran file terlalu besar (maks 2MB)");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImage(reader.result as string);
            setImageLoading(true);
            setCurrentFile(file);
            toast.success("Berhasil memilih gambar");
        };
        reader.readAsDataURL(file);

        try {
            await classifyImage(file);
        } catch (err) {
            console.error(err);
            toast.error("Gagal mengklasifikasi gambar");
        }
    };

    // Auto-save to history when results are available and user is logged in
    useEffect(() => {
        const saveToHistory = async () => {
            if (results.length > 0 && user && currentFile) {
                try {
                    await saveClassification({
                        imageUrl: selectedImage || undefined,
                        topLabel: results[0].label,
                        confidence: results[0].confidence,
                        allResults: results,
                        source: "upload",
                        processingTime: 150, // You might want to calculate actual processing time
                        imageSize: currentFile.size,
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
    }, [results, user, selectedImage, currentFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(null);
            setCurrentFile(null);
            handleFile(file);
        }
    };

    const resetUpload = () => {
        setSelectedImage(null);
        setCurrentFile(null);
        setImageLoading(false);
    };

    return (
        <div className="flex flex-col items-center w-full">
            {/* ✅ MODEL STATUS INDICATOR - TAMBAHKAN DISINI */}
            {modelStatus === "loading" && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg w-full max-w-lg"
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
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg w-full max-w-lg"
                >
                    <p className="text-red-800 text-sm">
                        ❌ Gagal memuat model AI. Fitur klasifikasi tidak tersedia.
                    </p>
                    <button
                        className="mt-2 text-sm text-red-700 underline"
                        onClick={() => window.location.reload()}
                    >
                        Refresh Halaman
                    </button>
                </motion.div>
            )}
            {/* Upload Area */}
            <motion.label
                htmlFor="fileInput"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className={`w-full max-w-lg border-2 border-dashed rounded-xl p-10 text-center hover:bg-muted/50 transition cursor-pointer ${modelStatus !== "ready" ? "opacity-50 cursor-not-allowed" : ""
                    }`}
            >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                    {modelStatus === "ready"
                        ? "Klik atau seret gambar ke sini"
                        : "Menunggu model AI..."}
                </p>
                <input
                    id="fileInput"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={modelStatus !== "ready"} // ✅ Disable input jika model tidak ready
                />

                {modelStatus === "ready" && (
                    <p className="text-sm text-green-600 mt-2">✅ AI Ready</p>
                )}
            </motion.label>

            {/* Preview & Result */}
            {selectedImage && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-10 w-full max-w-lg rounded-xl border p-6 shadow-sm bg-card relative"
                >
                    <div className="flex flex-col items-center">
                        {imageLoading && (
                            <Skeleton className="w-full max-w-md h-64 rounded-lg mb-4" />
                        )}

                        <Image
                            src={selectedImage}
                            alt="Preview sampah"
                            width={300}
                            height={300}
                            className={`rounded-lg object-cover border transition-opacity duration-500 ${imageLoading ? "opacity-0" : "opacity-100"
                                }`}
                            onLoadingComplete={() => setImageLoading(false)}
                        />

                        {/* Loading overlay */}
                        {loading && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
                                <LoadingSpinner size="lg" />
                                <p className="text-white mt-2">Menganalisis gambar...</p>
                            </div>
                        )}

                        {/* Result */}
                        <div className="mt-6 w-full">
                            {!loading && results.length > 0 && (
                                <ClassificationCard
                                    results={results}
                                    onSuggest={() => {
                                        // Handle suggestion feature
                                        toast.info("Fitur saran pengelolaan sampah akan segera hadir");
                                    }}
                                />
                            )}
                        </div>

                        {/* Reset Button */}
                        {!loading && (
                            <button
                                onClick={resetUpload}
                                className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Upload gambar lain
                            </button>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Login Reminder */}
            {!user && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm"
                >
                    <p>💡 <strong>Login untuk menyimpan riwayat klasifikasi</strong> - Hasil klasifikasi akan otomatis tersimpan di dashboard Anda</p>
                </motion.div>
            )}
        </div>
    );
};