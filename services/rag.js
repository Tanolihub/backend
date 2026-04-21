import { loadVectorDB } from "./vectordb.js";
import { createEmbedding } from "./embedding.js";
import { generateAnswer } from "./llm.js";

const cosineSimilarity = (a, b) => {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const similarity = dot / (Math.sqrt(magA) * Math.sqrt(magB));
  return isNaN(similarity) ? 0 : similarity;
};

// 🔥 MAIN FUNCTION (FULL PIPELINE)
export const getAIResponse = async (query, history = []) => {
  const db = loadVectorDB();

  if (db.length === 0) {
    return "Vector DB is empty! Please run ingestion script.";
  }

  // 1. embed query
  const queryEmbedding = await createEmbedding(query);

  // 2. similarity search
  const scored = db.map((item) => ({
    text: item.text,
    score: cosineSimilarity(queryEmbedding, item.embedding),
  }));

  // Increase chunk count to 5 for more context
  const topChunks = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); 

  // 3. build context
  const context = topChunks.map((c) => c.text).join("\n\n---\n\n");

  // 4. send to Groq LLM with History
  const answer = await generateAnswer(query, context, history);

  return answer;
};