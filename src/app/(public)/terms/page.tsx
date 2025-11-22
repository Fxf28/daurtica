"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertTriangle } from "lucide-react"

interface TermItem {
    term: string;
    definition: string;
}

interface TermSection {
    title: string;
    content?: string;
    items?: string[] | TermItem[];
    type?: "positive" | "negative";
}

const termsData: TermSection[] = [
    {
        title: "Pengantar",
        content: "Selamat datang di Daurtica. Dengan mengakses atau menggunakan platform kami, Anda menyetujui untuk terikat oleh syarat dan ketentuan yang diatur di bawah ini. Harap baca dengan seksama."
    },
    {
        title: "Definisi",
        items: [
            { term: "Platform:", definition: "Aplikasi dan website Daurtica" },
            { term: "Pengguna:", definition: "Individu yang mengakses atau menggunakan Platform" },
            { term: "Konten:", definition: "Semua materi termasuk teks, gambar, dan data yang tersedia di Platform" },
            { term: "Layanan:", definition: "Fitur klasifikasi, edukasi, dan informasi bank sampah" }
        ]
    },
    {
        title: "Kewajiban Pengguna",
        type: "positive",
        items: [
            "Memberikan informasi yang akurat dan valid saat menggunakan layanan",
            "Menggunakan platform untuk tujuan yang sesuai dan tidak melanggar hukum",
            "Menjaga kerahasiaan informasi akun dan tidak membagikan kredensial login"
        ]
    },
    {
        title: "Aktivitas yang Dilarang",
        type: "negative",
        items: [
            "Dilarang melakukan scraping, reverse engineering, atau mengganggu operasional platform",
            "Dilarang mengunggah konten yang melanggar hak cipta, mengandung malware, atau tidak senonoh",
            "Dilarang mencoba mengakses sistem atau data pengguna lain tanpa izin"
        ]
    },
    {
        title: "Hak Kekayaan Intelektual",
        content: "Semua hak kekayaan intelektual pada Platform, termasuk namun tidak terbatas pada copyright, trademark, dan patent, adalah milik Daurtica dan dilindungi oleh hukum yang berlaku. Pengguna dapat menggunakan Konten untuk keperluan pribadi dan non-komersial dengan menyertakan atribusi yang sesuai."
    },
    {
        title: "Pembatasan Tanggung Jawab",
        content: "Daurtica menyediakan layanan 'sebagaimana adanya' dan tidak memberikan jaminan terkait akurasi, kelengkapan, atau keandalan hasil klasifikasi. Pengguna bertanggung jawab penuh atas keputusan yang dibuat berdasarkan informasi dari Platform kami."
    },
    {
        title: "Perubahan Ketentuan",
        content: "Kami dapat memperbarui Syarat & Ketentuan ini dari waktu ke waktu. Perubahan akan diberitahukan melalui Platform dan berlaku efektif 30 hari setelah pengumuman. Dengan terus menggunakan Platform setelah perubahan, Anda dianggap menyetujui ketentuan yang baru."
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

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-background dark:from-gray-950/20 dark:to-background">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        Syarat & Ketentuan
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8"
                >
                    {termsData.map((section, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                        >
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle>{section.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
                                    {section.content && <p>{section.content}</p>}

                                    {section.items && section.type === "positive" && (
                                        <div className="space-y-4">
                                            {(section.items as string[]).map((item, itemIndex) => (
                                                <div key={itemIndex} className="flex items-start gap-3">
                                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <h4 className="font-semibold text-foreground">Kewajiban {itemIndex + 1}</h4>
                                                        <p className="mt-1">{item}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {section.items && section.type === "negative" && (
                                        <div className="space-y-4">
                                            {(section.items as string[]).map((item, itemIndex) => (
                                                <div key={itemIndex} className="flex items-start gap-3">
                                                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <h4 className="font-semibold text-foreground">Larangan {itemIndex + 1}</h4>
                                                        <p className="mt-1">{item}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {section.items && !section.type && (
                                        <div className="space-y-3">
                                            {(section.items as TermItem[]).map((item, itemIndex) => (
                                                <p key={itemIndex}>
                                                    <strong className="text-foreground">{item.term}</strong> {item.definition}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}

                    {/* Contact */}
                    <motion.div
                        variants={itemVariants}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>Kontak</CardTitle>
                            </CardHeader>
                            <CardContent className="text-muted-foreground">
                                <p>
                                    Untuk pertanyaan mengenai Syarat & Ketentuan ini, silakan hubungi kami di:
                                </p>
                                <p className="mt-2 font-medium text-foreground">hello@daurtica.id</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
}