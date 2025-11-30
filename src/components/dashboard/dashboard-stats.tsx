import { getDashboardStats } from "@/lib/get-dashboard-stats";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, Recycle, BarChart as BarChartIcon, ArrowUpRight, History, PieChart as PieChartIcon } from "lucide-react";
import { DashboardBarChart, DashboardPieChart } from "@/components/dashboard/dashboard-charts";

// 1. Definisikan Interface untuk Props StatCard (Menggantikan 'any')
interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    description: string;
    trend: "positive" | "negative" | "neutral" | "warning";
}

export async function DashboardStats({ userId }: { userId: string }) {
    // Fetch data berat di sini (Server Component)
    const stats = await getDashboardStats(userId);

    // Data processing logic
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

    return (
        <div className="space-y-6">
            {/* Statistic Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Klasifikasi"
                    value={stats.total}
                    icon={<Package className="h-6 w-6" />}
                    description="Jumlah total klasifikasi"
                    trend={stats.total > 0 ? "positive" : "neutral"}
                />
                <StatCard
                    title="Akurasi Rata-rata"
                    value={`${(stats.avgConfidence * 100).toFixed(1)}%`}
                    icon={<TrendingUp className="h-6 w-6" />}
                    description="Tingkat kepercayaan model"
                    trend={stats.avgConfidence > 0.7 ? "positive" : "warning"}
                />
                <StatCard
                    title="Jenis Sampah"
                    value={Object.keys(stats.byLabel).length}
                    icon={<Recycle className="h-6 w-6" />}
                    description="Varian sampah teridentifikasi"
                    trend="neutral"
                />
                <StatCard
                    title="Top Kategori"
                    value={Object.entries(stats.byLabel).length > 0
                        ? Object.entries(stats.byLabel).reduce((a, b) => b[1] > a[1] ? b : a)[0]
                        : "-"
                    }
                    icon={<BarChartIcon className="h-6 w-6" />}
                    description="Paling sering muncul"
                    trend="neutral"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChartIcon className="h-5 w-5" />
                            Distribusi Jenis Sampah
                        </CardTitle>
                        <CardDescription>8 jenis sampah teratas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DashboardBarChart data={barChartData} />
                    </CardContent>
                </Card>

                <Card className="border border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5" />
                            Persentase
                        </CardTitle>
                        <CardDescription>Proporsi total klasifikasi</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DashboardPieChart data={pieChartData} />
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-3 border border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Aktivitas Terbaru
                            </span>
                            <Badge variant="secondary">{stats.recent.length} items</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentWithDetails.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>Belum ada riwayat.</p>
                                </div>
                            ) : (
                                recentWithDetails.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-full ${Number(item.confidence) > 0.7 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                <Package className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">{item.topLabel}</p>
                                                <p className="text-sm text-muted-foreground">{item.timeAgo}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline">{item.confidencePercent}%</Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// 2. Terapkan Interface StatCardProps di sini
function StatCard({ title, value, icon, description, trend }: StatCardProps) {
    // Definisikan mapping warna dengan tipe yang aman
    const trendColors: Record<string, string> = {
        positive: "text-green-600 bg-green-100",
        negative: "text-red-600 bg-red-100",
        warning: "text-yellow-600 bg-yellow-100",
        neutral: "text-blue-600 bg-blue-100"
    };

    return (
        <Card className="border border-primary/20 hover:border-primary/40 transition-colors group">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${trendColors[trend]}`}>{icon}</div>
                    {trend === "positive" && <ArrowUpRight className="h-5 w-5 text-green-600" />}
                </div>
                <h3 className="text-2xl font-bold mb-1">{value}</h3>
                <p className="font-medium text-sm mb-2">{title}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    return date.toLocaleDateString('id-ID');
}