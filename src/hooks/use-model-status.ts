// hooks/use-model-status.ts
import { useState, useEffect } from "react";
import { loadModel } from "@/lib/classifier-browser";

export function useModelStatus() {
  const [modelStatus, setModelStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    loadModel()
      .then(() => setModelStatus("ready"))
      .catch(() => setModelStatus("error"));
  }, []);

  return modelStatus;
}
