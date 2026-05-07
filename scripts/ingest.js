import fs from "fs";
import { createEmbedding } from "../services/embedding.js";
import { saveVectorDB } from "../services/vectordb.js";

const DATA_PATH = "./data/data.txt";

/**
 * 📥 DATA INGESTION SCRIPT
 * Ye script 'data.txt' ko parhti hai or usay 'vectordb.json' ma convert karti hai.
 * Is se search fast ho jati hai.
 */
const run = async () => {
  if (!fs.existsSync(DATA_PATH)) {
    console.error("❌ File data/data.txt not found!");
    process.exit(1);
  }

  // 1. data.txt se sara text read karna
  const rawText = fs.readFileSync(DATA_PATH, "utf-8");

  // 2. Bimariyon (Diseases) k mutabiq text ko divide karna
  const sections = rawText.split(/(?=Main Cause of High Blood Pressure|What is Diabetes)/i);

  const vectorDB = [];
  let chunkId = 1;

  for (const section of sections) {
    const diseaseName = section.includes("High Blood Pressure") ? "High Blood Pressure (BP)" : "Diabetes (Sugar)";
    
    // 3. Section ko choty choty "Chunks" ma split karna
    const subChunks = section
      .split(/\n(?=\d+[.)]|\b(?:Main|Which|Common|Effective|Method|Diet|Avoidances|Summary|What|Causes|Vital|Principle|Nature|Dietary|Recommended|Core|Principles)\b)/i)
      .map(c => c.trim())
      .filter(c => c.length > 10);

    for (const text of subChunks) {
      const contextText = `Disease: ${diseaseName}\nContent: ${text}`;
      
      console.log(`🚀 Embedding chunk ${chunkId} for ${diseaseName}...`);
      
      // 4. Chunk ka "Embedding" (Number pattern) banana ta k AI samajh sakay
      const embedding = await createEmbedding(contextText);

      vectorDB.push({
        id: chunkId++,
        text: contextText,
        embedding,
      });
    }
  }

  // 5. Final database file (vectordb.json) save karna
  saveVectorDB(vectorDB);
  console.log(`🎉 Vector DB created with ${vectorDB.length} chunks!`);
};

run().catch(console.error);
