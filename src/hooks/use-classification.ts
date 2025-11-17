// hooks/use-classification.ts

"use client";

import { useState } from "react";
import { classifyImageBrowser } from "@/lib/classifier-browser";

type Prediction = {
  label: string;
  confidence: number;
};

export function useClassification() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Prediction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const classifyImage = async (image: Blob, mock = false) => {
    setLoading(true);
    setResults([]);
    setError(null);

    let url: string | null = null; // Declare url outside try block

    try {
      if (mock) {
        await new Promise((r) => setTimeout(r, 1500));
        setResults([
          { label: "Plastik", confidence: 0.92 },
          { label: "Organik", confidence: 0.05 },
          { label: "Kertas", confidence: 0.03 },
        ]);
        return;
      }

      url = URL.createObjectURL(image); // Assign value here
      const img = new Image();
      img.src = url;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Failed to load image"));
      });

      const predictions = await classifyImageBrowser(img);
      setResults(predictions);
    } catch (error) {
      console.error("Classification error:", error);
      setError("Gagal mengklasifikasi gambar. Pastikan model sudah terload.");
      // Fallback to mock data for demo
      setResults([
        { label: "Plastik", confidence: 0.85 },
        { label: "Organik", confidence: 0.1 },
        { label: "Kertas", confidence: 0.05 },
      ]);
    } finally {
      setLoading(false);
      // Cleanup URL if it was created
      if (url) {
        URL.revokeObjectURL(url);
      }
    }
  };

  return { classifyImage, loading, results, error };
}
