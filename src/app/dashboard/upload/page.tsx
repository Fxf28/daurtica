"use client";

import { UploadImage } from "@/components/upload-image";
import { motion } from "framer-motion";

export default function DashboardUploadPage() {
    return (
        <div className="container mx-auto py-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-foreground mb-2">Upload Gambar</h1>
                <p className="text-muted-foreground">
                    Upload gambar sampah untuk diklasifikasi dan simpan ke riwayat
                </p>
            </motion.div>

            <UploadImage />
        </div>
    );
}