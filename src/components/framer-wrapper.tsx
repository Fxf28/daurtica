"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";

// Gunakan 'domAnimation' untuk fitur standar (fade, slide). 
// Ini jauh lebih ringan daripada fitur lengkap.
const loadFeatures = () =>
    import("framer-motion").then(() => domAnimation);

export const FramerLazyConfig = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    return (
        <LazyMotion features={loadFeatures} strict>
            {children}
        </LazyMotion>
    );
};

// Export 'm' component pengganti 'motion'
// m.div jauh lebih ringan karena tidak memuat library di awal
export const M = m;