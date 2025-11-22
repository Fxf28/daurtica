"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import {
    Info,
    Recycle,
    BookOpen,
    MapPin,
    Phone,
    Mail,
    ExternalLink,
    Heart
} from "lucide-react"
import { SiFacebook, SiX, SiInstagram, SiYoutube } from "@icons-pack/react-simple-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="w-full bg-background border-t">
            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

                    {/* Brand Section */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="flex items-center gap-2">
                            <Recycle className="h-8 w-8 text-green-600" />
                            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                                Daurtica
                            </span>
                            <Badge variant="secondary" className="text-xs">
                                Beta
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            Platform pintar untuk klasifikasi dan edukasi pengelolaan sampah.
                            Bersama kita wujudkan Indonesia bersih dan berkelanjutan.
                        </p>

                        {/* Social Links */}
                        <div className="flex space-x-3 pt-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <SiFacebook className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <SiX className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <SiInstagram className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <SiYoutube className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                            Navigasi
                        </h3>
                        <nav className="flex flex-col space-y-3">
                            <Link
                                href="/"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group"
                            >
                                <div className="w-1 h-1 bg-muted-foreground rounded-full group-hover:bg-foreground transition-colors" />
                                Beranda
                            </Link>
                            <Link
                                href="/classify"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group"
                            >
                                <div className="w-1 h-1 bg-muted-foreground rounded-full group-hover:bg-foreground transition-colors" />
                                Klasifikasi Sampah
                            </Link>
                            <Link
                                href="/education"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group"
                            >
                                <div className="w-1 h-1 bg-muted-foreground rounded-full group-hover:bg-foreground transition-colors" />
                                Edukasi
                            </Link>
                            <Link
                                href="/map"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group"
                            >
                                <div className="w-1 h-1 bg-muted-foreground rounded-full group-hover:bg-foreground transition-colors" />
                                Peta Bank Sampah
                            </Link>
                            <Link
                                href="/about"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group"
                            >
                                <div className="w-1 h-1 bg-muted-foreground rounded-full group-hover:bg-foreground transition-colors" />
                                Tentang Kami
                            </Link>
                        </nav>
                    </div>

                    {/* Resources */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                            Sumber Daya
                        </h3>
                        <nav className="flex flex-col space-y-3">
                            <Link
                                href="/education"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group"
                            >
                                <BookOpen className="h-4 w-4" />
                                Artikel Edukasi
                                <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                            <Link
                                href="/education/panduan-lengkap-pengelolaan-sampah-rumah-tangga"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group"
                            >
                                <Recycle className="h-4 w-4" />
                                Panduan Daur Ulang
                                <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                            <Link
                                href="/faq"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 group"
                            >
                                <Info className="h-4 w-4" />
                                FAQ
                                <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        </nav>
                    </div>

                    {/* Contact & Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                            Kontak
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>
                                    Jl. Lingkungan Hijau No. 123<br />
                                    Surakarta, 57100
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4 flex-shrink-0" />
                                <span>+62 21 1234 5678</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4 flex-shrink-0" />
                                <span>hello@daurtica.id</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Bottom Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span>© {currentYear} Daurtica. All rights reserved.</span>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center gap-1">
                            <span>Made with</span>
                            <Heart className="h-4 w-4 text-red-500 fill-current" />
                            <span>for a better planet</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 text-muted-foreground">
                        <Link href="/privacy" className="text-xs hover:text-foreground transition-colors">
                            Kebijakan Privasi
                        </Link>
                        <Separator orientation="vertical" className="h-4" />
                        <Link href="/terms" className="text-xs hover:text-foreground transition-colors">
                            Syarat & Ketentuan
                        </Link>
                        <Separator orientation="vertical" className="h-4" />
                        <Link href="/sitemap" className="text-xs hover:text-foreground transition-colors">
                            Sitemap
                        </Link>
                    </div>
                </div>

                {/* Stats Badge */}
                <div className="mt-4 flex justify-center">
                    <Badge variant="outline" className="text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span>Sistem aktif · Telah mengklasifikasi 1,000+ sampah</span>
                        </div>
                    </Badge>
                </div>
            </div>
        </footer>
    )
}