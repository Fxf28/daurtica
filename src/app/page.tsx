"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Camera, BookOpen, Leaf } from "lucide-react"

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen items-center justify-center px-6 sm:px-12 md:px-20 bg-background">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-10 w-full max-w-6xl py-20">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-6 max-w-xl"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Daurtica ♻️
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground">
            AI untuk <span className="font-semibold text-primary">Sampah yang Lebih Bijak</span>.
            Klasifikasikan sampah secara otomatis dan belajar cara mendaur ulang dengan lebih cerdas.
          </p>
          <div className="flex gap-4 mt-4">
            <Link
              href="/classify"
              className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium shadow-md hover:shadow-lg transition"
            >
              Mulai Klasifikasi
            </Link>
            <Link
              href="/about"
              className="px-6 py-3 rounded-lg border font-medium hover:bg-muted transition"
            >
              Tentang Kami
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center"
        >
          <Image
            src="/hero-recycle.svg"
            alt="Ilustrasi daur ulang"
            width={400}
            height={400}
            className="drop-shadow-xl rounded-xl"
            priority
          />
        </motion.div>
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-8 w-full max-w-6xl py-16">
        {[
          {
            title: "Klasifikasi Otomatis",
            desc: "Gunakan AI untuk mengenali jenis sampah hanya dengan gambar.",
            icon: <Camera className="h-8 w-8 text-primary" />,
          },
          {
            title: "Edukasi Daur Ulang",
            desc: "Pelajari cara memilah dan mendaur ulang sesuai jenisnya.",
            icon: <BookOpen className="h-8 w-8 text-primary" />,
          },
          {
            title: "Dukungan Lingkungan",
            desc: "Ikut serta dalam menjaga bumi yang lebih hijau dan bersih.",
            icon: <Leaf className="h-8 w-8 text-primary" />,
          },
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.2 }}
            className="rounded-xl border p-6 shadow-sm hover:shadow-md transition"
          >
            <div className="mb-3">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-muted-foreground">{feature.desc}</p>
          </motion.div>
        ))}
      </section>


    </main>
  )
}
