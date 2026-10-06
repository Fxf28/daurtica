"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";

// Fitur standar (fade, slide) untuk komponen `m`.
// Catatan performa (Phase 10): fitur diimpor langsung (sinkron) — bukan lagi
// `import("framer-motion")` yang menarik seluruh index package (~55 KB gzip)
// ke chunk async di setiap halaman yang memakai LazyMotion.
export const FramerLazyConfig = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    return (
        <LazyMotion features={domAnimation} strict>
            {children}
        </LazyMotion>
    );
};

// Export 'm' component pengganti 'motion'
// m.div jauh lebih ringan karena tidak memuat library di awal
export const M = m;