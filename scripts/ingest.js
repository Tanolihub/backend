import fs from "fs";
import { createEmbedding } from "../services/embedding.js";
import { saveVectorDB } from "../services/vectordb.js";

const DATA_PATH = "./data/data.txt";

const run = async () => {
  if (!fs.existsSync(DATA_PATH)) {
    console.error("❌ File data/data.txt not found!");
    process.exit(1);
  }

  const rawText = fs.readFileSync(DATA_PATH, "utf-8");

  // Split file by disease first
  const sections = rawText.split(/(?=Main Cause of High Blood Pressure|What is Diabetes)/i);

  const vectorDB = [];
  let chunkId = 1;

  for (const section of sections) {
    const diseaseName = section.includes("High Blood Pressure") ? "High Blood Pressure (BP)" : "Diabetes (Sugar)";
    
    // Improved regex for sub-chunking
    // We split on newlines followed by a digit or a list of common Unani section keywords
    const subChunks = section
      .split(/\n(?=\d+[.)]|\b(?:Main|Which|Common|Effective|Method|Diet|Avoidances|Summary|What|Causes|Vital|Principle|Nature|Dietary|Recommended|Core|Principles)\b)/i)
      .map(c => c.trim())
      .filter(c => c.length > 10);

    for (const text of subChunks) {
      const contextText = `Disease: ${diseaseName}\nContent: ${text}`;
      
      console.log(`🚀 Embedding chunk ${chunkId} for ${diseaseName}...`);
      const embedding = await createEmbedding(contextText);

      vectorDB.push({
        id: chunkId++,
        text: contextText,
        embedding,
      });
    }
  }

  saveVectorDB(vectorDB);
  console.log(`🎉 Vector DB created with ${vectorDB.length} chunks!`);
};

run().catch(console.error);