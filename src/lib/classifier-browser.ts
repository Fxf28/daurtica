// lib/classifier-browser.ts
import * as tf from "@tensorflow/tfjs";

let model: tf.GraphModel | null = null;
let modelLoading: Promise<tf.GraphModel> | null = null;

const LABELS = ["Cardboard", "Food Organics", "Glass", "Metal", "Miscellaneous Trash", "Paper", "Plastic", "Textile Trash", "Vegetation", "batteries", "light_bulbs_tubes", "mercury_thermometers", "ointment", "pesticide_containers"];

export async function loadModel() {
  if (model) return model;

  if (!modelLoading) {
    modelLoading = tf
      .loadGraphModel("/model/model.json")
      .then((loadedModel) => {
        model = loadedModel;
        console.log("✅ TFJS Browser model loaded!");
        return model;
      })
      .catch((error) => {
        console.error("❌ Failed to load model:", error);
        modelLoading = null;
        throw error;
      });
  }

  return modelLoading;
}

export async function classifyImageBrowser(imgElement: HTMLImageElement) {
  try {
    const model = await loadModel();

    const input = tf.tidy(() => tf.browser.fromPixels(imgElement).resizeBilinear([224, 224]).div(255).expandDims(0));

    const output = model.predict(input) as tf.Tensor;
    const data = await output.data();

    input.dispose();
    output.dispose();

    const indexed = Array.from(data).map((v, i) => ({ index: i, score: v }));
    const top5 = indexed
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((x) => ({
        label: LABELS[x.index],
        confidence: Number(x.score.toFixed(4)),
      }));

    return top5;
  } catch (error) {
    console.error("Classification failed:", error);
    throw new Error("Model classification failed");
  }
}
