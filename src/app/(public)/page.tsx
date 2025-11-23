// src/app/(public)/page.tsx
"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Camera, BookOpen, Leaf, MapPin, Zap, Users, Recycle, ArrowRight, Star, Shield, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"

// Definisikan interface untuk FloatingElement
interface FloatingElementProps {
    className: string;
    icon: React.ReactNode;
    text: string;
    delay?: number;
}

// Komponen terpisah untuk mengurangi beban render
const HeroSection = () => {
    const stats = [
        { number: "1.000+", label: "Sampah Terklasifikasi", icon: <Recycle className="h-4 w-4" /> },
        { number: "95%", label: "Akurasi AI", icon: <Zap className="h-4 w-4" /> },
        { number: "50+", label: "Bank Sampah", icon: <MapPin className="h-4 w-4" /> },
        { number: "14", label: "Jenis Sampah", icon: <Shield className="h-4 w-4" /> }
    ]

    return (
        <section className="relative min-h-screen flex items-center justify-center px-6 sm:px-12 md:px-20 overflow-hidden">
            {/* Background Elements - simplified */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Hero Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-8"
                    >
                        <div className="space-y-4">
                            <Badge variant="secondary" className="px-4 py-2 text-sm">
                                <Sparkles className="h-3 w-3 mr-2" />
                                Platform Pintar Pengelolaan Sampah
                            </Badge>

                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                                Kelola Sampah
                                <span className="block bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                                    Lebih Cerdas
                                </span>
                            </h1>

                            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                                Gunakan teknologi AI untuk mengenali, memilah, dan mengelola sampah dengan tepat.
                                Bersama kita wujudkan Indonesia yang bersih dan berkelanjutan.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button asChild size="lg" className="h-12 px-8 text-base font-semibold">
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

                        {/* Stats Preview */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="grid grid-cols-2 gap-4 pt-8"
                        >
                            {stats.slice(0, 2).map((stat, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        {stat.icon}
                                    </div>
                                    <div>
                                        <div className="font-bold text-xl text-foreground">{stat.number}</div>
                                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Hero Visual */}
                    <HeroVisual />
                </div>
            </div>
        </section>
    )
}

const HeroVisual = () => {
    const [isLoaded, setIsLoaded] = useState(false)

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
        >
            <div className="relative z-10">
                <Image
                    src="/hero-recycle.svg"
                    alt="Ilustrasi daur ulang modern"
                    width={480}
                    height={480}
                    className="w-full h-auto"
                    priority
                    onLoad={() => setIsLoaded(true)}
                />
            </div>

            {/* Floating Elements - simplified */}
            {isLoaded && (
                <>
                    <FloatingElement
                        className="top-10 -left-2"
                        icon={<Star className="h-4 w-4 text-green-600 fill-current" />}
                        text="AI Powered"
                    />
                    <FloatingElement
                        className="top-10 right-4"
                        icon={<Users className="h-4 w-4 text-blue-600" />}
                        text="Community"
                        delay={1}
                    />
                </>
            )}
        </motion.div>
    )
}

const FloatingElement = ({ className, icon, text, delay = 0 }: FloatingElementProps) => (
    <motion.div
        animate={{
            y: [0, -10, 0],
        }}
        transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay
        }}
        className={`absolute bg-background/80 backdrop-blur-sm border rounded-xl p-3 shadow-sm ${className}`}
    >
        <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium text-foreground">{text}</span>
        </div>
    </motion.div>
)

const StatsSection = () => {
    const stats = [
        { number: "1.000+", label: "Sampah Terklasifikasi", icon: <Recycle className="h-4 w-4" /> },
        { number: "95%", label: "Akurasi AI", icon: <Zap className="h-4 w-4" /> },
        { number: "50+", label: "Bank Sampah", icon: <MapPin className="h-4 w-4" /> },
        { number: "14", label: "Jenis Sampah", icon: <Shield className="h-4 w-4" /> }
    ]

    return (
        <section className="py-12 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-6"
                >
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            whileHover={{ scale: 1.02 }}
                            className="text-center p-4 bg-background/80 backdrop-blur-sm rounded-xl shadow-sm border"
                        >
                            <div className="flex justify-center mb-2">
                                <div className="p-2 rounded-full bg-primary/10">
                                    {stat.icon}
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-foreground mb-1">{stat.number}</div>
                            <div className="text-xs text-muted-foreground">{stat.label}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}

const FeaturesSection = () => {
    const features = [
        {
            title: "Klasifikasi AI Cerdas",
            desc: "Gunakan teknologi machine learning untuk mengenali jenis sampah hanya dengan gambar.",
            icon: <Camera className="h-5 w-5" />,
            color: "from-blue-500 to-cyan-500"
        },
        {
            title: "Edukasi Interaktif",
            desc: "Pelajari cara memilah dan mendaur ulang dengan konten yang mudah dipahami.",
            icon: <BookOpen className="h-5 w-5" />,
            color: "from-green-500 to-emerald-500"
        },
        {
            title: "Peta Bank Sampah",
            desc: "Temukan lokasi bank sampah terdekat untuk penyerahan sampah yang tepat.",
            icon: <MapPin className="h-5 w-5" />,
            color: "from-orange-500 to-red-500"
        },
        {
            title: "Ramah Lingkungan",
            desc: "Berkontribusi langsung untuk bumi yang lebih hijau dan berkelanjutan.",
            icon: <Leaf className="h-5 w-5" />,
            color: "from-purple-500 to-pink-500"
        }
    ]

    return (
        <section className="py-16 px-6">
            <div className="container mx-auto max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <Badge variant="outline" className="px-4 py-2 mb-4">
                        ✨ Fitur Unggulan
                    </Badge>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Semua yang Anda Butuhkan untuk{" "}
                        <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                            Kelola Sampah
                        </span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Platform lengkap dengan teknologi terkini untuk membantu Anda mengelola sampah dengan mudah dan efektif.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -2 }}
                        >
                            <Card className="h-full group hover:shadow-md transition-all duration-300 border">
                                <CardContent className="p-6 text-center">
                                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.color} text-white mb-4`}>
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2 text-foreground">
                                        {feature.title}
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed text-sm">
                                        {feature.desc}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

const HowItWorksSection = () => {
    const steps = [
        {
            step: "01",
            title: "Unggah Gambar",
            description: "Ambil foto sampah atau unggah dari galeri Anda",
            icon: <Camera className="h-6 w-6" />
        },
        {
            step: "02",
            title: "Analisis AI",
            description: "Sistem kami akan mengidentifikasi jenis sampah secara otomatis",
            icon: <Sparkles className="h-6 w-6" />
        },
        {
            step: "03",
            title: "Dapatkan Solusi",
            description: "Terima panduan pengelolaan yang tepat untuk sampah Anda",
            icon: <BookOpen className="h-6 w-6" />
        }
    ]

    return (
        <section className="py-16 bg-gradient-to-b from-background to-green-50/50 dark:to-green-950/10">
            <div className="container mx-auto max-w-6xl px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Mulai dalam{" "}
                        <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                            3 Langkah
                        </span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Proses yang sederhana dan cepat untuk mendapatkan solusi pengelolaan sampah terbaik.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="relative text-center"
                        >
                            <div className="relative z-10 bg-background border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                    {step.step}
                                </div>
                                <div className="p-3 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 rounded-xl mb-4 inline-flex">
                                    {step.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-foreground">
                                    {step.title}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed text-sm">
                                    {step.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <CTASection />
            </div>
        </section>
    )
}

const CTASection = () => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-center mt-12"
    >
        <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border">
            <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 text-foreground">
                    Siap Mengelola Sampah dengan Lebih Baik?
                </h3>
                <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Bergabung dengan ribuan pengguna yang sudah menggunakan Daurtica untuk solusi pengelolaan sampah yang lebih cerdas.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" className="h-12 px-8 text-base font-semibold">
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
            </CardContent>
        </Card>
    </motion.div>
)

export default function Home() {
    return (
        <main className="flex flex-col min-h-screen bg-gradient-to-b from-background to-green-50/30 dark:to-green-950/10">
            <HeroSection />
            <StatsSection />
            <FeaturesSection />
            <HowItWorksSection />

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'WebApplication',
                        name: 'Daurtica',
                        url: 'https://daurtica.vercel.app',
                        description: 'Platform AI untuk klasifikasi dan edukasi pengelolaan sampah',
                        applicationCategory: 'EducationalApplication',
                        operatingSystem: 'Any',
                        offers: {
                            '@type': 'Offer',
                            price: '0',
                            priceCurrency: 'IDR'
                        },
                        author: {
                            '@type': 'Organization',
                            name: 'Daurtica'
                        },
                        featureList: [
                            'Klasifikasi Sampah AI',
                            'Edukasi Pengelolaan Sampah',
                            'Peta Bank Sampah',
                            'Panduan Daur Ulang'
                        ]
                    })
                }}
            />
        </main>
    )
}