import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react"; // 1. Import Suspense
import { DashboardStats } from "@/components/dashboard/dashboard-stats"; // 2. Import Komponen Data
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"; // 3. Import Skeleton
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { History, Upload, Camera, Sparkles } from "lucide-react";

export default async function DashboardPage() {
    const { userId } = await auth();

    if (!userId) {
        return <div className="p-10 text-center">Silakan login.</div>;
    }

    // Quick Actions (Static Data - Render Instan)
    const quickActions = [
        {
            href: "/dashboard/upload",
            icon: Upload,
            title: "Upload Gambar",
            description: "Klasifikasi dari file gambar",
            variant: "default" as const
        },
        {
            href: "/dashboard/camera",
            icon: Camera,
            title: "Kamera Real-time",
            description: "Klasifikasi menggunakan kamera",
            variant: "outline" as const
        },
        {
            href: "/dashboard/generate",
            icon: Sparkles,
            title: "Generate Edukasi",
            description: "Buat konten edukasi otomatis",
            variant: "outline" as const
        }
    ];

    return (
        <div className="space-y-8 p-6">
            {/* Header (Instan - Tidak perlu menunggu DB) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Dashboard Overview
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Ringkasan aktivitas dan statistik klasifikasi sampah Anda
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/history" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Lihat Riwayat Lengkap
                    </Link>
                </Button>
            </div>

            {/* Quick Actions (Instan) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <Card key={action.href} className="border border-primary/20 hover:border-primary/40 transition-colors">
                            <CardContent className="p-0">
                                <Button
                                    asChild
                                    variant={action.variant}
                                    className="w-full h-auto py-4 px-6 justify-start gap-4 bg-transparent hover:bg-muted/50 border-0 text-foreground"
                                >
                                    <Link href={action.href}>
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-semibold">{action.title}</div>
                                            <div className="text-xs text-muted-foreground font-normal">{action.description}</div>
                                        </div>
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* 🚀 STREAMING AREA: Statistik & Grafik */}
            {/* Bagian ini akan loading terpisah dengan Skeleton, tidak memblokir halaman */}
            <Suspense fallback={<DashboardSkeleton />}>
                <DashboardStats userId={userId} />
            </Suspense>
        </div>
    );
}