// src/app/education/page.tsx
"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Recycle, Leaf, Trash2, Factory } from "lucide-react"

const topics = [
    {
        title: "3R: Reduce, Reuse, Recycle",
        description:
            "Pelajari bagaimana mengurangi sampah, menggunakan kembali barang, dan mendaur ulang untuk kehidupan yang lebih berkelanjutan.",
        details:
            "Reduce: Kurangi penggunaan barang sekali pakai. Reuse: Gunakan kembali barang yang masih layak pakai. Recycle: Olah sampah menjadi bahan baru.",
        icon: Recycle,
    },
    {
        title: "Sampah Organik vs Anorganik",
        description:
            "Kenali perbedaan dan cara pengolahan sampah organik serta anorganik agar tidak mencemari lingkungan.",
        details:
            "Sampah organik: sisa makanan, daun, ranting. Bisa diolah menjadi kompos. Sampah anorganik: plastik, logam, kaca. Perlu dikumpulkan untuk daur ulang.",
        icon: Leaf,
    },
    {
        title: "Bahaya Sampah B3",
        description:
            "Bahan berbahaya dan beracun (B3) memerlukan penanganan khusus. Yuk pahami cara membuangnya dengan benar.",
        details:
            "Contoh B3: baterai, lampu neon, cat, obat kadaluarsa. Jangan dibuang sembarangan. Bisa diserahkan ke TPS B3 atau program pengumpulan khusus.",
        icon: Trash2,
    },
    {
        title: "Ekonomi Sirkular",
        description:
            "Bagaimana konsep circular economy membantu mengubah sampah menjadi sumber daya baru untuk industri.",
        details:
            "Circular economy memanfaatkan limbah sebagai bahan baku baru, mengurangi konsumsi sumber daya alam, dan mengurangi limbah yang dibuang ke lingkungan.",
        icon: Factory,
    },
]

export default function EducationPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1 px-6 sm:px-12 md:px-20 py-12">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                        Edukasi Daur Ulang
                    </h1>
                    <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
                        Tingkatkan kesadaran tentang pengelolaan sampah dan daur ulang melalui
                        artikel, tips, dan pengetahuan sederhana.
                    </p>
                </motion.div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {topics.map((topic, index) => (
                        <motion.div
                            key={topic.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Card className="h-full hover:shadow-lg cursor-pointer transition">
                                        <CardHeader>
                                            <topic.icon className="h-10 w-10 text-primary mb-2" />
                                            <CardTitle>{topic.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-muted-foreground text-sm">{topic.description}</p>
                                        </CardContent>
                                    </Card>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogTitle>{topic.title}</DialogTitle>
                                    <p className="mt-2 text-muted-foreground">{topic.details}</p>
                                </DialogContent>
                            </Dialog>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    )
}
