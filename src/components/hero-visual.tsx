// components/hero-visual.tsx

"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { useState } from "react"
import { Users, Star } from "lucide-react"

// Interface props
interface FloatingElementProps {
    className: string;
    icon: React.ReactNode;
    text: string;
    delay?: number;
}

export const HeroVisual = () => {
    const [isLoaded, setIsLoaded] = useState(false)

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
        >
            <div className="relative z-10">
                {/* Priority True = Wajib untuk LCP (Loading Cepat) */}
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

            {/* Elemen melayang hanya muncul setelah gambar selesai dimuat */}
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
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay }}
        className={`absolute bg-background/80 backdrop-blur-sm border rounded-xl p-3 shadow-sm ${className}`}
    >
        <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium text-foreground">{text}</span>
        </div>
    </motion.div>
)