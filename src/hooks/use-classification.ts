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

  const classifyImage = async (image: Blob, mock = false) => {
    setLoading(true);
    setResults([]);

    try {
      // Dummy mode (buat testing)
      if (mock) {
        await new Promise((r) => setTimeout(r, 1500));
        setResults([
          { label: "Plastik", confidence: 0.92 },
          { label: "Organik", confidence: 0.05 },
          { label: "Kertas", confidence: 0.03 },
        ]);
        return;
      }

      // Convert Blob → HTMLImageElement
      const url = URL.createObjectURL(image);
      const img = new Image();
      img.src = url;

      await new Promise((resolve) => (img.onload = resolve));

      // Classify
      const predictions = await classifyImageBrowser(img);

      setResults(predictions);
    } catch (error) {
      console.error("Classification error:", error);
    } finally {
      setLoading(false);
    }
  };

  return { classifyImage, loading, results };
}
