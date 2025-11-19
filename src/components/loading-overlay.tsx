'use client';

import { useNavigationLoading } from '@/hooks/use-navigation-loading';
import { LoadingSpinner } from '@/components/loading-spinner';

export default function LoadingOverlay() {
    const isLoading = useNavigationLoading();

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-lg font-medium">Memuat halaman...</p>
            </div>
        </div>
    );
}