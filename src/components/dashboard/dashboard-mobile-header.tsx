"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

interface MobileHeaderProps {
    onMenuToggle: () => void;
}

export function MobileHeader({ onMenuToggle }: MobileHeaderProps) {
    return (
        <header className="lg:hidden sticky top-0 z-40 bg-background border-b shadow-sm">
            <div className="flex items-center justify-between p-4">
                <button
                    onClick={onMenuToggle}
                    className="p-2 rounded-md hover:bg-muted transition"
                >
                    <Menu className="h-6 w-6" />
                </button>

                <Link href="/" className="text-lg font-bold">
                    Daurtica
                </Link>

                <UserButton
                    appearance={{
                        elements: {
                            rootBox: "flex-shrink-0",
                            avatarBox: "w-8 h-8",
                        },
                    }}
                />
            </div>
        </header>
    );
}