import { pipeline } from "@xenova/transformers";

let extractor;

// ⚡ INIT EXTRACTOR
const initExtractor = async () => {
  if (!extractor) {
    extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
  }
};

// 💎 CREATE EMBEDDING
export const createEmbedding = async (text) => {
  await initExtractor();

  const output = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });

  return Array.from(output.data);
};