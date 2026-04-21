import fs from "fs";
import path from "path";

const DB_PATH = path.resolve("./data/vectordb.json");

// 💾 SAVE VECTOR DB
export const saveVectorDB = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  console.log(`💾 Saved ${data.length} chunks to DB!`);
};

// 📥 LOAD VECTOR DB
export const loadVectorDB = () => {
  if (!fs.existsSync(DB_PATH)) {
    console.warn("⚠️ Vector DB not found! Empty array returned.");
    return [];
  }

  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw);
};