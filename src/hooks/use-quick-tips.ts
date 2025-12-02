"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

// Tipe data (sesuaikan dengan yang di gemini-ai.ts)
export interface QuickTipResponse {
  title: string;
  category: "Organik" | "Anorganik" | "B3" | "Residu";
  action: "Kompos" | "Daur Ulang" | "Bank Sampah" | "Buang di TPA" | "Khusus (B3)";
  tips: string[];
  funFact: string;
}

const fetchTips = async (label: string): Promise<QuickTipResponse> => {
  const response = await fetch("/api/classification/tips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label }),
  });

  if (!response.ok) {
    toast.error("Gagal mengambil saran AI");
    throw new Error("Gagal mengambil saran AI");
  }

  return response.json();
};

export const useQuickTips = (label: string | null, isOpen: boolean) => {
  return useQuery({
    // Key unik berdasarkan label. Jika label "Plastic", cache akan disimpan di key ini.
    queryKey: ["quick-tips", label],

    // Fungsi fetcher
    queryFn: () => fetchTips(label!),

    // Hanya fetch jika label ada DAN dialog sedang terbuka
    enabled: !!label && isOpen,

    // Data dianggap "segar" selamanya (karena tips sampah jarang berubah).
    // Ini yang membuat aplikasi terasa INSTAN saat dibuka kedua kalinya.
    staleTime: Infinity,

    // Simpan di cache selama 1 jam meski tidak dipakai
    gcTime: 1000 * 60 * 60,

    // Jangan retry jika error (hemat kuota API)
    retry: false,
  });
};
