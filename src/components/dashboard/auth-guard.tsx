"use client";

import { useUser } from "@clerk/nextjs";

interface AuthGuardProps {
    children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const { user, isLoaded } = useUser();

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-lg text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-lg text-muted-foreground">
                    Anda harus login untuk mengakses dashboard.
                </p>
            </div>
        );
    }

    return <>{children}</>;
}