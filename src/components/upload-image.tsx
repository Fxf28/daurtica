"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useClassification } from "@/hooks/use-classification";
import { ClassificationCard } from "@/components/classification-card";
import { LoadingSpinner } from "@/components/loading-spinner";
import { toast } from "sonner";

export const UploadImage = () => {
    const { classifyImage, loading, results } = useClassification();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(false);

    const handleFile = async (file: File) => {
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div className="flex flex-col items-center w-full">
            {/* Upload Area */}
            <motion.label
                htmlFor="fileInput"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="w-full max-w-lg border-2 border-dashed rounded-xl p-10 text-center hover:bg-muted/50 transition cursor-pointer"
            >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Klik atau seret gambar ke sini</p>
                <input
                    id="fileInput"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
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

                        {/* --- NEW: overlay ketika loading model --- */}
                        {loading && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
                                <LoadingSpinner size="lg" />
                                <p className="text-white mt-2">Menganalisis gambar...</p>
                            </div>
                        )}

                        {/* Result */}
                        <div className="mt-6 w-full">
                            {!loading && results.length > 0 && (
                                <ClassificationCard results={results} />
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
