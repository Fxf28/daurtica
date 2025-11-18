"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
import { ArrowLeft, X, LogOut } from "lucide-react";
import { menuItems } from "@/lib/dashboard-menu";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { user } = useUser();

    const isActive = (href: string, exact: boolean = false) => {
        if (exact) {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    const linkClass = (href: string, exact: boolean = false) =>
        `flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${isActive(href, exact)
            ? "bg-primary text-primary-foreground shadow-md font-semibold"
            : "text-foreground hover:bg-muted hover:shadow-sm"
        }`;

    return (
        <aside
            className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-80 bg-card border-r shadow-lg
        transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
        >
            {/* Sidebar Header */}
            <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Dashboard
                    </h2>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-md hover:bg-muted transition"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-6 space-y-2">
                {/* Back to Home Link */}
                <Link
                    href="/"
                    className="flex items-center space-x-3 px-3 py-3 rounded-lg text-foreground hover:bg-muted hover:shadow-sm transition-all duration-200 mb-4 border border-muted"
                    onClick={onClose}
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span>Kembali ke Beranda</span>
                </Link>

                {/* Menu Items Loop */}
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={linkClass(item.href, item.exact)}
                            onClick={onClose}
                        >
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Section */}
            <div className="p-6 border-t">
                <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <UserButton
                            appearance={{
                                elements: {
                                    rootBox: "flex-shrink-0",
                                    avatarBox: "w-8 h-8",
                                },
                            }}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {user?.fullName || user?.username}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {user?.primaryEmailAddress?.emailAddress}
                            </p>
                        </div>
                    </div>
                </div>

                <SignOutButton redirectUrl="/">
                    <button className="flex items-center space-x-3 px-3 py-3 rounded-lg text-foreground hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 w-full">
                        <LogOut className="h-5 w-5" />
                        <span>Sign Out</span>
                    </button>
                </SignOutButton>
            </div>
        </aside>
    );
}