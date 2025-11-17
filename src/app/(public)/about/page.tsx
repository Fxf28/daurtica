"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-1 container mx-auto px-6 sm:px-12 md:px-20 py-16">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                        Tentang <span className="text-primary">Daurtica</span>
                    </h1>
                    <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
                        Daurtica adalah platform edukasi dan teknologi berbasis AI yang membantu
                        masyarakat Indonesia mengenali, memilah, dan mengelola sampah dengan lebih
                        cerdas. Kami percaya bahwa teknologi dapat mendorong perubahan nyata untuk
                        lingkungan yang lebih berkelanjutan.
                    </p>
                </motion.div>

                <div className="grid gap-8 md:grid-cols-2">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="h-full shadow-md">
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Misi Kami</h2>
                                <p className="text-muted-foreground">
                                    Membantu masyarakat memahami pentingnya pemilahan sampah dengan
                                    menghadirkan alat klasifikasi berbasis deep learning, serta
                                    menyediakan informasi edukatif tentang daur ulang.
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Card className="h-full shadow-md">
                            <CardContent className="p-6">
                                <h2 className="text-xl font-semibold mb-4">Visi Kami</h2>
                                <p className="text-muted-foreground">
                                    Menjadi platform teknologi lingkungan terdepan di Indonesia
                                    yang mendorong kebiasaan pengelolaan sampah yang lebih baik,
                                    sehingga tercipta masa depan yang bersih dan berkelanjutan.
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-16 text-center"
                >
                    <Image
                        src="/logo.png"
                        alt="Daurtica Logo"
                        width={120}
                        height={120}
                        className="mx-auto mb-6"
                    />
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        Bersama Daurtica, mari wujudkan Indonesia yang lebih bersih, sehat, dan
                        sadar lingkungan.
                    </p>
                </motion.div>
            </main>
        </div>
    );
}
