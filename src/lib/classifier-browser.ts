import type { GraphModel, Tensor } from "@tensorflow/tfjs";

let model: GraphModel | null = null;
let modelLoading: Promise<GraphModel> | null = null;

// Tambahkan variabel status global
let isReady = false;

const LABELS = ["Cardboard", "Food Organics", "Glass", "Metal", "Miscellaneous Trash", "Paper", "Plastic", "Textile Trash", "Vegetation", "batteries", "light_bulbs_tubes", "mercury_thermometers", "ointment", "pesticide_containers"];

// Helper untuk cek status instan (tanpa Promise)
export function getModelStatus() {
  return isReady ? "ready" : "loading";
}

export async function loadModel() {
  if (model) return model;

  if (!modelLoading) {
    const tf = await import("@tensorflow/tfjs");

    // Set backend ke WebGL (GPU) agar cepat, fallback ke CPU
    try {
      await tf.setBackend("webgl");
    } catch {
      console.warn("WebGL not supported, falling back to CPU");
    }

    modelLoading = tf
      .loadGraphModel("/model/model.json")
      .then((loadedModel) => {
        model = loadedModel;
        isReady = true; // Tandai sebagai siap
        console.log("✅ TFJS Browser model loaded!");
        return model;
      })
      .catch((error) => {
        console.error("❌ Failed to load model:", error);
        modelLoading = null;
        isReady = false;
        throw error;
      });
  }

  return modelLoading;
}

export async function classifyImageBrowser(imgElement: HTMLImageElement | HTMLVideoElement) {
  try {
    const [tf, model] = await Promise.all([import("@tensorflow/tfjs"), loadModel()]);

    if (!model) throw new Error("Model not loaded");

    // tf.tidy otomatis membersihkan tensor sisa (mencegah memory leak)
    const result = tf.tidy(() => {
      const input = tf.browser.fromPixels(imgElement).resizeBilinear([224, 224]).div(255).expandDims(0);

      const output = model.predict(input) as Tensor;
      return output.dataSync(); // Ambil data secara sinkron di dalam tidy
    });

    // Proses hasil (tidak perlu await data() karena pakai dataSync)
    const indexed = Array.from(result).map((v, i) => ({ index: i, score: v }));
    const top5 = indexed
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((x) => ({
        label: LABELS[x.index],
        confidence: Number(Number(x.score).toFixed(4)),
      }));

    return top5;
  } catch (error) {
    console.error("Classification failed:", error);
    throw new Error("Model classification failed");
  }
}
