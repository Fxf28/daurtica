'use client';

import { useGlobalLoading } from '@/hooks/use-global-loading';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useEffect, useState } from 'react';

export default function LoadingOverlay() {
    const isLoading = useGlobalLoading();
    const [showLoader, setShowLoader] = useState(false);

    // Debounce dan smooth transition untuk loader
    useEffect(() => {
        if (isLoading) {
            setShowLoader(true);
        } else {
            // Delay hiding untuk animasi yang smooth
            const timer = setTimeout(() => {
                setShowLoader(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isLoading]);

    if (!showLoader) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300 ${isLoading ? 'opacity-100' : 'opacity-0'
            }`}>
            <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-lg font-medium">Memuat halaman...</p>
                <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{
                            width: isLoading ? '90%' : '100%',
                            transition: isLoading ? 'width 10s ease-out' : 'width 0.3s ease-out'
                        }}
                    />
                </div>
            </div>
        </div>
    );
}