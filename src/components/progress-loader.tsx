"use client";

import { useEffect, useState } from "react";
import { useNavigationLoading } from "@/hooks/use-navigation-loading";

export default function ProgressLoader() {
    const isLoading = useNavigationLoading();
    const [progress, setProgress] = useState(0);
    const [show, setShow] = useState(false);

    useEffect(() => {
        let progressInterval: NodeJS.Timeout;
        let hideTimeout: NodeJS.Timeout;

        if (isLoading) {
            setShow(true);
            setProgress(10);

            // Simulate progress
            progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + Math.random() * 15;
                });
            }, 200);
        } else {
            // Complete progress and hide
            setProgress(100);
            hideTimeout = setTimeout(() => {
                setShow(false);
                setProgress(0);
            }, 500);
        }

        return () => {
            if (progressInterval) clearInterval(progressInterval);
            if (hideTimeout) clearTimeout(hideTimeout);
        };
    }, [isLoading]);

    if (!show) return null;

    return (
        <div className="fixed top-0 left-0 w-full z-[9999]">
            {/* Progress Bar */}
            <div className="h-1.5 bg-gray-200 dark:bg-gray-800">
                <div
                    className="h-full bg-green-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Recycle Loading Indicator */}
            <div className="flex items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    {/* Animated Recycle Icon */}
                    <div className="relative">
                        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-green-600 text-lg font-bold">♻</span>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Memuat halaman...
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {Math.round(progress)}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}