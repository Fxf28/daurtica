"use client";

import { ReactNode, useState } from "react";
import { Sidebar } from "@/components/dashboard-sidebar";
import { MobileHeader } from "@/components/dashboard-mobile-header";
import { AuthGuard } from "@/components/auth-guard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    return (
        <AuthGuard>
            <div className="flex min-h-screen bg-background">
                {/* Mobile Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={closeSidebar}
                    />
                )}

                {/* Sidebar */}
                <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-h-screen">
                    {/* Mobile Header */}
                    <MobileHeader onMenuToggle={toggleSidebar} />

                    {/* Page Content */}
                    <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
                </div>
            </div>
        </AuthGuard>
    );
}