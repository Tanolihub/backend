import { loadVectorDB } from "./vectordb.js";
import { createEmbedding } from "./embedding.js";
import { generateAnswer } from "./llm.js";
import { GeneticAlgorithmService } from "./ga.js";

/**
 * 🌟 REFINED CHAT PIPELINE (Directly using data.txt)
 * Flow: Sawal -> Vector Search (data.txt) -> GA Optimization -> LLM Final Response
 */
export const getAIResponse = async (query, history = []) => {
  const db = loadVectorDB();

  if (db.length === 0) {
    return "Vector DB is empty! Please run 'node scripts/ingest.js' first.";
  }

  // STEP 1: Vector Search (data.txt se relevant chunks nikaalna)
  const queryEmbedding = await createEmbedding(query);
  
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

  const scored = db.map((item) => ({
    content: item.text, // Mapping 'text' to 'content' for GA
    score: cosineSimilarity(queryEmbedding, item.embedding),
    confidence: 0.8, // Default values for GA
    helpfulness: 0.8
  }));

  // STEP 2: Top candidates ko GA k liye select karna
  const candidates = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 15); 

  if (candidates.length === 0) {
    return "Maaf kijiye, muje aap k sawal k mutabiq koi maloomat nahi mili.";
  }

  // STEP 3: Genetic Algorithm (GA) Optimization
  console.log(`🧬 GA is optimizing ${candidates.length} chunks from data.txt...`);
  const ga = new GeneticAlgorithmService(query);
  
  const optimizedResponse = await ga.evolve(candidates);

  // STEP 4: LLM (Groq) se final answer banwana
  // GA ne jo best combined context diya, LLM usay natural language ma convert kary ga.
  const finalAnswer = await generateAnswer(query, optimizedResponse.content, history);

  return finalAnswer;
};
