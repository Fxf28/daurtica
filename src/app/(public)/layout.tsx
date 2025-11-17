import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <header className="w-full flex justify-end items-center p-4 gap-4 h-16">
                <Navbar />
            </header>
            {children}
            <Footer />
        </>
    );
}
