"use client";

import Link from "next/link";
import { Camera, ArrowRight, Leaf, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadModel } from "@/lib/classifier-browser";

export const HeroCTA = () => {
    return (
        <div className="flex flex-col sm:flex-row gap-4">
            <Button
                asChild
                size="lg"
                className="h-12 px-8 text-base font-semibold"
                // TRIK UX: Download model saat mouse menyentuh tombol
                onMouseEnter={() => {
                    console.log("🖱️ Prefetching AI Model...");
                    loadModel();
                }}
                onTouchStart={() => loadModel()}
            >
                <Link href="/classify" className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Mulai Klasifikasi
                    <ArrowRight className="h-4 w-4" />
                </Link>
            </Button>

            <Button asChild variant="outline" size="lg" className="h-12 px-8">
                <Link href="/about" className="flex items-center gap-2">
                    <Leaf className="h-5 w-5" />
                    Pelajari Lebih Lanjut
                </Link>
            </Button>
        </div>
    );
};

export const BottomCTA = () => {
    return (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
                asChild
                size="lg"
                className="h-12 px-8 text-base font-semibold"
                onMouseEnter={() => loadModel()}
                onTouchStart={() => loadModel()}
            >
                <Link href="/classify" className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Coba Sekarang Gratis
                </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8">
                <Link href="/education" className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Pelajari Edukasi
                </Link>
            </Button>
        </div>
    )
}