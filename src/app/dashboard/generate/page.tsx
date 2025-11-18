// src/app/dashboard/generate/page.tsx
"use client";

import { motion } from "framer-motion";
import { EducationPersonalList } from "@/components/dashboard/education-personal-list";

export default function GenerateEdukasiPage() {
    return (
        <div className="container mx-auto py-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-foreground mb-2">Education Personal</h1>
                <p className="text-muted-foreground">
                    Generate dan kelola konten edukasi personal tentang pengelolaan sampah menggunakan AI
                </p>
            </motion.div>

            <EducationPersonalList />
        </div>
    );
}