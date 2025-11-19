"use client";

import React from "react";
import { cn } from "@/lib/utils";

type SpinnerProps = {
    size?: "sm" | "md" | "lg";
    variant?: "default" | "recycle";
    className?: string;
};

export const LoadingSpinner: React.FC<SpinnerProps> = ({
    size = "md",
    variant = "default",
    className
}) => {
    const sizes = {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
    };

    const baseClasses = "animate-spin rounded-full border-primary border-t-transparent";

    if (variant === "recycle") {
        return (
            <div className={cn("relative", sizes[size], className)}>
                <div className={cn(
                    "absolute inset-0 border-4 border-green-500 border-t-transparent rounded-full",
                    sizes[size]
                )} />
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-green-600 text-xs font-bold">♻</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                baseClasses,
                sizes[size],
                size === "sm" && "border-2",
                size === "md" && "border-2",
                size === "lg" && "border-4",
                className
            )}
        />
    );
};