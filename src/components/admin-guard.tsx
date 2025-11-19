// src/components/admin-guard.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { LoadingSpinner } from "@/components/loading-spinner";

interface AdminGuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
    const { user, isLoaded } = useUser();

    const isAdmin = user?.publicMetadata?.role === 'admin';

    if (!isLoaded) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <LoadingSpinner />
            </div>
        );
    }

    if (!user || !isAdmin) {
        return fallback || (
            <div className="text-center py-12">
                <div className="bg-muted/50 rounded-lg p-8 max-w-md mx-auto">
                    <p className="text-lg text-muted-foreground">
                        Akses ditolak. Hanya admin yang dapat mengakses halaman ini.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}