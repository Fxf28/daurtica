import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="border border-primary/10">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                                <Skeleton className="h-5 w-5 rounded-full" />
                            </div>
                            <Skeleton className="h-8 w-24 mb-2" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-40 mt-2" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                    <Card key={i} className="border border-primary/10">
                        <CardHeader>
                            <Skeleton className="h-6 w-48 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-80 w-full rounded-lg" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Activity Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border border-primary/10">
                    <CardHeader>
                        <div className="flex justify-between">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex justify-between items-center p-4 border rounded-lg">
                                    <div className="flex gap-4">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-6 w-12 rounded-full" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions Placeholder (walaupun ini statis, untuk konsistensi layout) */}
                <div className="hidden lg:block">
                    <Skeleton className="h-64 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}