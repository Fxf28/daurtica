"use client"

import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

const faqData = [
    {
        question: "Bagaimana cara menggunakan fitur klasifikasi sampah?",
        answer: "Anda dapat menggunakan fitur klasifikasi sampah dengan mengunggah gambar sampah melalui halaman 'Klasifikasi Sampah'. Sistem AI kami akan menganalisis gambar dan memberikan klasifikasi jenis sampah beserta cara pengelolaannya."
    },
    {
        question: "Apa saja jenis sampah yang dapat diklasifikasikan?",
        answer: "Sistem kami dapat mengklasifikasikan 4 jenis sampah utama: organik, anorganik, B3 (Bahan Berbahaya dan Beracun), dan residu. Setiap jenis memiliki metode pengelolaan yang berbeda."
    },
    {
        question: "Apakah aplikasi ini gratis?",
        answer: "Ya, Daurtica sepenuhnya gratis untuk digunakan. Kami berkomitmen untuk mendukung gerakan Indonesia bersih tanpa biaya."
    },
    {
        question: "Bagaimana akurasi sistem klasifikasi?",
        answer: "Sistem kami memiliki akurasi sekitar 85-90% untuk gambar dengan kualitas baik. Untuk hasil terbaik, pastikan gambar jelas dengan pencahayaan cukup dan objek sampah terlihat dominan."
    },
    {
        question: "Apa itu bank sampah dan bagaimana cara menemukannya?",
        answer: "Bank sampah adalah tempat pengelolaan sampah yang menerima penyerahan sampah dari masyarakat. Anda dapat menemukan bank sampah terdekat melalui fitur 'Peta Bank Sampah' di aplikasi kami."
    },
    {
        question: "Bagaimana cara menyimpan riwayat klasifikasi?",
        answer: "Riwayat klasifikasi otomatis tersimpan di akun Anda. Anda dapat mengaksesnya melalui dashboard pengguna setelah login."
    },
    {
        question: "Apakah data saya aman?",
        answer: "Ya, kami sangat menjaga privasi dan keamanan data pengguna. Gambar yang diunggah hanya digunakan untuk keperluan klasifikasi dan tidak dibagikan ke pihak ketiga."
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

export default function FAQPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-background dark:from-green-950/20 dark:to-background">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        Pertanyaan Umum
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Temukan jawaban untuk pertanyaan yang sering diajukan tentang Daurtica dan fitur-fiturnya.
                    </p>
                </motion.div>

                {/* FAQ List */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                >
                    {faqData.map((item, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            className="bg-card rounded-lg shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <details className="group">
                                <summary className="flex justify-between items-center p-6 cursor-pointer list-none hover:bg-accent/50 transition-colors">
                                    <h3 className="text-lg font-semibold text-foreground pr-4">
                                        {item.question}
                                    </h3>
                                    <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-open:rotate-180 flex-shrink-0" />
                                </summary>
                                <div className="px-6 pb-6 pt-2 border-t border-border">
                                    <p className="text-muted-foreground leading-relaxed">
                                        {item.answer}
                                    </p>
                                </div>
                            </details>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Contact Support */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="mt-12"
                >
                    <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                        <CardContent className="p-8 text-center">
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                Masih punya pertanyaan?
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                Tim support kami siap membantu Anda
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button asChild>
                                    <a href="mailto:hello@daurtica.id">
                                        Hubungi Support
                                    </a>
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link href="/education">
                                        Jelajahi Edukasi
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}