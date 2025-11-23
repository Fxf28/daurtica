// src/app/(public)/layout.tsx
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 pt-16"> {/* Tambahkan pt-16 untuk memberi ruang navbar */}
                {children}
            </main>
            <Footer />
        </div>
    );
}