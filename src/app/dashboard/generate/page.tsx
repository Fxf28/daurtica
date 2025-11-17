// app/dashboard/generate/page.tsx
"use client";

import { motion } from "framer-motion";

export default function GenerateEdukasiPage() {
    return (
        <div className="container mx-auto py-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-foreground mb-2">Generate Edukasi</h1>
                <p className="text-muted-foreground">
                    Generate konten edukasi tentang pengelolaan sampah (Fitur dalam pengembangan)
                </p>
            </motion.div>

            <div className="bg-muted/50 border rounded-lg p-8 text-center">
                <p className="text-muted-foreground">Fitur ini akan segera hadir.</p>
            </div>
        </div>
    );
}