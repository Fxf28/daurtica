"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Info, Recycle, BookOpen } from "lucide-react"

export function Footer() {
    return (
        <footer className="w-full border-t mt-12 py-6">
            <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} Daurtica. Dibuat dengan ❤️ untuk bumi.</p>

                <div className="flex items-center gap-6">
                    <Link
                        href="/about"
                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                        <Info className="h-4 w-4" /> Tentang
                    </Link>
                    <Separator orientation="vertical" className="h-4" />
                    <Link
                        href="/education"
                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                        <BookOpen className="h-4 w-4" /> Edukasi
                    </Link>
                    <Separator orientation="vertical" className="h-4" />
                    <Link
                        href="/classify"
                        className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                        <Recycle className="h-4 w-4" /> Klasifikasi
                    </Link>
                </div>
            </div>
        </footer>
    )
}
