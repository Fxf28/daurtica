import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function MapPageSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
            {/* Sidebar Skeleton */}
            <div className="lg:col-span-1 space-y-4">
                {/* Search Card Skeleton */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <div className="flex gap-2">
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-6 w-16" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Count Skeleton */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                            <Skeleton className="h-8 w-12 mx-auto" />
                            <Skeleton className="h-4 w-32 mx-auto" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Map Area Skeleton (LCP Element Placeholder) */}
            <div className="lg:col-span-2">
                <Card>
                    <CardContent className="p-0">
                        <Skeleton className="w-full h-[600px] rounded-lg bg-muted/50" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}