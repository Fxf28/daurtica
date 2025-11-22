"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Eye, Database, Users, Lock } from "lucide-react"

const privacyData = [
    {
        icon: Shield,
        title: "Pengantar",
        content: "Di Daurtica, kami menghargai dan melindungi privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda saat menggunakan platform kami."
    },
    {
        icon: Database,
        title: "Data yang Kami Kumpulkan",
        sections: [
            {
                subtitle: "Data Pribadi",
                items: ["Nama dan alamat email saat registrasi", "Foto profil (opsional)", "Preferensi bahasa dan notifikasi"]
            },
            {
                subtitle: "Data Penggunaan",
                items: ["Riwayat klasifikasi sampah", "Gambar yang diunggah untuk klasifikasi", "Hasil analisis dan rekomendasi", "Log akses dan aktivitas platform"]
            },
            {
                subtitle: "Data Teknis",
                items: ["Alamat IP dan informasi browser", "Data cookies dan teknologi serupa", "Informasi perangkat yang digunakan"]
            }
        ]
    },
    {
        icon: Eye,
        title: "Penggunaan Data",
        content: "Kami menggunakan data yang dikumpulkan untuk: Menyediakan dan meningkatkan layanan klasifikasi sampah, Mengembangkan model AI yang lebih akurat, Memberikan rekomendasi pengelolaan sampah yang personal, Mengirim notifikasi dan update penting, Memastikan keamanan dan mencegah penyalahgunaan, Analisis statistik untuk pengembangan platform"
    },
    {
        icon: Users,
        title: "Berbagi Data",
        content: "Kami tidak menjual data pribadi Anda kepada pihak ketiga. Data dapat dibagikan dalam kondisi berikut: Dengan penyedia layanan yang membantu operasional platform, Untuk kepatuhan hukum atau proses peradilan, Dalam bentuk data agregat dan anonim untuk penelitian, Dengan persetujuan eksplisit dari pengguna. Semua pihak ketiga yang menerima data terikat kontrak kerahasiaan dan hanya dapat menggunakan data untuk tujuan yang ditentukan."
    },
    {
        icon: Lock,
        title: "Perlindungan Data",
        items: ["Enkripsi data dalam transit dan diam", "Autentikasi multi-faktor untuk akses admin", "Pemantauan keamanan 24/7", "Backup data reguler dan recovery plan", "Pembatasan akses berdasarkan kebutuhan (principle of least privilege)"]
    },
    {
        title: "Penyimpanan Data",
        content: "Kami menyimpan data pribadi hanya selama diperlukan untuk tujuan yang ditentukan: Data akun: Selama akun aktif atau sesuai permintaan penghapusan, Riwayat klasifikasi: 3 tahun untuk analisis dan perbaikan model, Data teknis: Maksimal 1 tahun untuk keperluan keamanan, Gambar yang diunggah: Dihapus otomatis setelah 30 hari"
    },
    {
        title: "Hak Pengguna",
        items: [
            "Hak Akses: Meminta salinan data pribadi yang kami simpan",
            "Hak Koreksi: Memperbaiki data yang tidak akurat",
            "Hak Penghapusan: Meminta penghapusan data pribadi",
            "Hak Pembatasan: Membatasi pemrosesan data dalam kondisi tertentu",
            "Hak Portabilitas: Menerima data dalam format terstruktur",
            "Hak Keberatan: Menolak pemrosesan data untuk pemasaran langsung"
        ]
    },
    {
        title: "Cookies dan Teknologi Serupa",
        content: "Kami menggunakan cookies untuk: Mengautentikasi sesi pengguna, Mengingat preferensi pengguna, Analisis penggunaan platform, Meningkatkan kinerja aplikasi. Anda dapat mengelola preferensi cookies melalui pengaturan browser Anda."
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

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-background dark:from-blue-950/20 dark:to-background">
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <motion.div
                        className="flex justify-center mb-4"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <Shield className="h-12 w-12 text-primary" />
                    </motion.div>
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        Kebijakan Privasi
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
                    {privacyData.map((section, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                        >
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        {section.icon && <section.icon className="h-5 w-5" />}
                                        {section.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
                                    {section.content && <p>{section.content}</p>}

                                    {section.sections && (
                                        <div className="space-y-6">
                                            {section.sections.map((subSection, subIndex) => (
                                                <div key={subIndex}>
                                                    <h4 className="font-semibold text-foreground mb-2">{subSection.subtitle}</h4>
                                                    <ul className="list-disc list-inside space-y-1">
                                                        {subSection.items.map((item, itemIndex) => (
                                                            <li key={itemIndex}>{item}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {section.items && !section.sections && (
                                        <ul className="list-disc list-inside space-y-2">
                                            {section.items.map((item, itemIndex) => (
                                                <li key={itemIndex}>{item}</li>
                                            ))}
                                        </ul>
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
                                <CardTitle>Kontak dan Pertanyaan</CardTitle>
                            </CardHeader>
                            <CardContent className="text-muted-foreground">
                                <p>
                                    Untuk pertanyaan tentang Kebijakan Privasi atau penggunaan data pribadi Anda,
                                    silakan hubungi:
                                </p>
                                <p className="mt-2 font-medium text-foreground">Email: hello@daurtica.id</p>
                                <p className="mt-4 text-sm">
                                    Kami berkomitmen untuk merespons pertanyaan dalam waktu 7 hari kerja.
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
}