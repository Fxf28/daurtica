import { useState, useEffect } from "react";
import { loadModel, getModelStatus } from "@/lib/classifier-browser";

export function useModelStatus() {
  // 🚀 OPTIMASI: Cek status awal secara langsung!
  // Jika getModelStatus() == 'ready', React akan render UI siap LANGSUNG (tanpa flash loading)
  const [status, setStatus] = useState<"loading" | "ready" | "error">(() => {
    return getModelStatus() === "ready" ? "ready" : "loading";
  });

  useEffect(() => {
    // Jika sudah ready di awal, tidak perlu load lagi
    if (status === "ready") return;

    let mounted = true;

    loadModel()
      .then(() => {
        if (mounted) setStatus("ready");
      })
      .catch(() => {
        if (mounted) setStatus("error");
      });

    return () => {
      mounted = false;
    };
  }, [status]);

  return status;
}
