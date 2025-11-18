// app/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { getDashboardStats } from "@/lib/get-dashboard-stats";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { ArrowUpRight, History, TrendingUp, Package, Recycle, Camera, Upload, Sparkles, PieChart as PieChartIcon, BarChart as BarChartIcon } from "lucide-react";
import { DashboardBarChart, DashboardPieChart } from "@/components/dashboard/dashboard-charts";

export default async function DashboardPage() {
    const { userId } = await auth();

    if (!userId) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-semibold">Unauthorized</h2>
                <p className="text-muted-foreground">Silakan login untuk mengakses dashboard.</p>
            </div>
        );
    }

    const stats = await getDashboardStats(userId);

    // Prepare data for charts (simple arrays, no React components)
    const barChartData = Object.entries(stats.byLabel)
        .map(([label, count]) => ({
            label,
            count,
            percentage: (count / stats.total) * 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

    const pieChartData = Object.entries(stats.byLabel)
        .map(([label, count], index) => ({
            label,
            value: count,
            fill: `hsl(${index * 45}, 70%, 50%)`
        }));

    const recentWithDetails = stats.recent.map(item => ({
        ...item,
        confidencePercent: (Number(item.confidence) * 100).toFixed(1),
        timeAgo: getTimeAgo(new Date(item.createdAt))
    }));

    // Quick Actions data configuration
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
            {/* Header */}
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

            {/* Statistic Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Klasifikasi"
                    value={stats.total}
                    icon={<Package className="h-6 w-6" />}
                    description="Jumlah total klasifikasi yang dilakukan"
                    trend={stats.total > 0 ? "positive" : "neutral"}
                />

                <StatCard
                    title="Akurasi Rata-rata"
                    value={`${(stats.avgConfidence * 100).toFixed(1)}%`}
                    icon={<TrendingUp className="h-6 w-6" />}
                    description="Tingkat kepercayaan model rata-rata"
                    trend={stats.avgConfidence > 0.7 ? "positive" : stats.avgConfidence > 0.5 ? "warning" : "negative"}
                />

                <StatCard
                    title="Jenis Sampah Terdeteksi"
                    value={Object.keys(stats.byLabel).length}
                    icon={<Recycle className="h-6 w-6" />}
                    description="Beragam jenis sampah yang teridentifikasi"
                    trend={Object.keys(stats.byLabel).length > 3 ? "positive" : "neutral"}
                />

                <StatCard
                    title="Label Terbanyak"
                    value={Object.entries(stats.byLabel).length > 0
                        ? Object.entries(stats.byLabel).reduce((a, b) => b[1] > a[1] ? b : a)[0]
                        : "-"
                    }
                    icon={<BarChartIcon className="h-6 w-6" />}
                    description="Jenis sampah paling sering diklasifikasi"
                    trend="neutral"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart - Top Labels */}
                <Card className="border border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChartIcon className="h-5 w-5" />
                            Distribusi Jenis Sampah
                        </CardTitle>
                        <CardDescription>
                            8 jenis sampah yang paling sering terdeteksi
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DashboardBarChart data={barChartData} />
                    </CardContent>
                </Card>

                {/* Pie Chart - Label Distribution */}
                <Card className="border border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5" />
                            Persentase Jenis Sampah
                        </CardTitle>
                        <CardDescription>
                            Distribusi semua jenis sampah yang terdeteksi
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DashboardPieChart data={pieChartData} />
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <Card className="lg:col-span-2 border border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Aktivitas Terbaru
                            </span>
                            <Badge variant="secondary">
                                {stats.recent.length} items
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentWithDetails.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Belum ada riwayat klasifikasi</p>
                                    <Button asChild className="mt-4">
                                        <Link href="/dashboard/upload">
                                            Mulai Klasifikasi Pertama
                                        </Link>
                                    </Button>
                                </div>
                            ) : (
                                recentWithDetails.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${Number(item.confidence) > 0.7 ? 'bg-green-100 text-green-600' :
                                                Number(item.confidence) > 0.5 ? 'bg-yellow-100 text-yellow-600' :
                                                    'bg-red-100 text-red-600'
                                                }`}>
                                                <Package className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">{item.topLabel}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {item.timeAgo}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant={
                                                Number(item.confidence) > 0.7 ? "default" :
                                                    Number(item.confidence) > 0.5 ? "secondary" : "destructive"
                                            }>
                                                {item.confidencePercent}%
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border border-primary/20">
                    <CardHeader>
                        <CardTitle>Aksi Cepat</CardTitle>
                        <CardDescription>
                            Mulai klasifikasi baru dengan cepat
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Button
                                    key={action.href}
                                    asChild
                                    variant={action.variant}
                                    className="w-full justify-start gap-3 h-auto py-3 min-h-[64px]"
                                >
                                    <Link href={action.href}>
                                        <Icon className="h-5 w-5 flex-shrink-0" />
                                        <div className="text-left min-w-0 flex-1">
                                            <div className="font-semibold truncate">
                                                {action.title}
                                            </div>
                                            <div className="text-sm opacity-70 truncate">
                                                {action.description}
                                            </div>
                                        </div>
                                    </Link>
                                </Button>
                            );
                        })}

                        <div className="pt-4 border-t">
                            <div className="text-sm text-muted-foreground mb-2">Statistik Mingguan</div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Klasifikasi</span>
                                    <span className="font-semibold">+12%</span>
                                </div>
                                <Progress value={65} className="h-2" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({ title, value, icon, description, trend }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    description: string;
    trend: "positive" | "negative" | "neutral" | "warning";
}) {
    const trendColors = {
        positive: "text-green-600 bg-green-100",
        negative: "text-red-600 bg-red-100",
        warning: "text-yellow-600 bg-yellow-100",
        neutral: "text-blue-600 bg-blue-100"
    };

    return (
        <Card className="border border-primary/20 hover:border-primary/40 transition-colors group">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${trendColors[trend]}`}>
                        {icon}
                    </div>
                    {trend === "positive" && (
                        <ArrowUpRight className="h-5 w-5 text-green-600" />
                    )}
                </div>
                <h3 className="text-2xl font-bold mb-1">{value}</h3>
                <p className="font-medium text-sm mb-2">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
    return date.toLocaleDateString('id-ID');
}