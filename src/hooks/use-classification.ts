"use client";

import { useState } from "react";

type Prediction = {
  label: string;
  confidence: number;
};

export function useClassification() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Prediction[]>([]);

  const classifyImage = async (image: Blob, source: "camera" | "upload", mock = false) => {
    setLoading(true);

    try {
      if (mock) {
        // dummy delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        // hasil dummy top-3
        setResults([
          { label: "Plastik", confidence: 0.92 },
          { label: "Organik", confidence: 0.05 },
          { label: "Kertas", confidence: 0.03 },
        ]);
      } else {
        // nanti bisa diganti panggil API beneran
        console.log("classifyImage called with", { image, source });
      }
    } catch (err) {
      console.error("Classification error:", err);
    } finally {
      setLoading(false);
    }
  };

  return { classifyImage, loading, results };
}
