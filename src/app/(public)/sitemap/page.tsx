"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Home,
    Recycle,
    BookOpen,
    Shield,
    Map
} from "lucide-react"

const sitemapData = [
    {
        category: "Navigasi Utama",
        icon: Home,
        links: [
            { name: "Beranda", href: "/", description: "Halaman utama Daurtica" },
            { name: "Tentang Kami", href: "/about", description: "Profil dan visi misi Daurtica" },
        ]
    },
    {
        category: "Fitur Utama",
        icon: Recycle,
        links: [
            { name: "Klasifikasi Sampah", href: "/classify", description: "Klasifikasi sampah dengan AI" },
            { name: "Edukasi Pengelolaan Sampah", href: "/education", description: "Artikel dan panduan lengkap" },
            { name: "Peta Bank Sampah", href: "/map", description: "Temukan bank sampah terdekat" },
        ]
    },
    {
        category: "Dashboard Pengguna",
        icon: Map,
        links: [
            { name: "Dashboard Utama", href: "/dashboard", description: "Panel kontrol pengguna" },
            { name: "Klasifikasi Kamera", href: "/dashboard/camera", description: "Klasifikasi via kamera" },
            { name: "Unggah Gambar", href: "/dashboard/upload", description: "Klasifikasi via unggah gambar" },
            { name: "Riwayat Klasifikasi", href: "/dashboard/history", description: "Lihat riwayat analisis" },
            { name: "Edukasi Personal", href: "/dashboard/education", description: "Konten edukasi personal" },
            { name: "Generate Konten", href: "/dashboard/generate", description: "Buat konten edukasi" },
            { name: "Manajemen Bank Sampah", href: "/dashboard/waste-banks", description: "Kelola data bank sampah" },
        ]
    },
    {
        category: "Sumber Daya",
        icon: BookOpen,
        links: [
            { name: "Artikel Edukasi", href: "/education", description: "Kumpulan artikel pengelolaan sampah" },
            { name: "Panduan Lengkap", href: "/education/panduan-lengkap-pengelolaan-sampah-rumah-tangga", description: "Panduan komprehensif pengelolaan sampah" },
            { name: "FAQ", href: "/faq", description: "Pertanyaan umum" },
        ]
    },
    {
        category: "Legal",
        icon: Shield,
        links: [
            { name: "Kebijakan Privasi", href: "/privacy", description: "Kebijakan privasi data" },
            { name: "Syarat & Ketentuan", href: "/terms", description: "Syarat penggunaan layanan" },
            { name: "Peta Situs", href: "/sitemap", description: "Struktur lengkap website" },
        ]
    }
]

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5
        }
    }
}

const statsVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.5,
            delay: 0.8
        }
    }
}

export default function SitemapPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-background dark:from-gray-950/20 dark:to-background">
            <div className="container mx-auto px-4 py-12 max-w-6xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        Peta Situs
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Jelajahi semua halaman dan fitur yang tersedia di Daurtica
                    </p>
                </motion.div>

                {/* Sitemap Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {sitemapData.map((category, categoryIndex) => (
                        <motion.div
                            key={categoryIndex}
                            variants={itemVariants}
                        >
                            <Card className="hover:shadow-lg transition-shadow h-full">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <category.icon className="h-5 w-5 text-primary" />
                                        {category.category}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {category.links.map((link, linkIndex) => (
                                        <div key={linkIndex} className="group">
                                            <Link
                                                href={link.href}
                                                className="block p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all group"
                                            >
                                                <div className="font-medium text-foreground group-hover:text-primary">
                                                    {link.name}
                                                </div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    {link.description}
                                                </div>
                                            </Link>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Quick Stats */}
                <motion.div
                    variants={statsVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
                >
                    {[
                        { number: "10+", label: "Halaman Utama" },
                        { number: "4", label: "Fitur Inti" },
                        { number: "7", label: "Dashboard Tools" },
                        { number: "3", label: "Dokumen Legal" }
                    ].map((stat, index) => (
                        <motion.div
                            key={index}
                            whileHover={{ scale: 1.05 }}
                            className="bg-card rounded-xl p-6 shadow-sm border border-border"
                        >
                            <div className="text-2xl font-bold text-primary mb-1">{stat.number}</div>
                            <div className="text-sm text-muted-foreground">{stat.label}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    )
}