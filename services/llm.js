import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// ==============================
// LANGUAGE DETECTOR
// ==============================
function detectLanguage(text) {
  const urduRegex = /[\u0600-\u06FF]/;
  // Common Roman Urdu indicators
  const romanUrduWords = /\b(kya|hai|nahi|mujhe|tum|ka|ki|ke|mera|teri|ap|apka|ilaj|sugar|marz|bataye|batao|karen|karo)\b/i;

  if (urduRegex.test(text)) return "Urdu (Script)";
  if (romanUrduWords.test(text)) return "Roman Urdu";
  return "English";
}

// ==============================
// MAIN FUNCTION
// ==============================
export const generateAnswer = async (question, context, history = []) => {
  try {
    const language = detectLanguage(question);

    const messages = [
      {
        role: "system",
        content: `You are "Digital Hakeem", a professional, friendly, and formal AI health consultant. Your personality is similar to ChatGPT—smooth, empathetic, and intelligent.

STRICT OPERATIONAL GUIDELINES:

1. ABSOLUTE LANGUAGE PURITY:
   - You ONLY understand and speak: English, Urdu (Pure Script), and Roman Urdu.
   - NO HINDI: Strictly avoid Hindi vocabulary, grammar patterns, or "Hindi tags". Treat Hindi as an unknown language.
   - PURE URDU SCRIPT: Use standard Urdu script (Nasta'liq style logic). Use Urdu-specific punctuation (۔ ، ؟). Every word must be in proper Urdu format as it is traditionally written.
   - ALWAYS respond in the EXACT language and script the user used.

2. KNOWLEDGE BASE ADHERENCE:
   - If the query is related to the "CONTEXT FROM KNOWLEDGE BASE", give an EXACT response based ONLY on that data. Do not add outside information.
   - Answer ONLY what is asked. Keep it precise and matched to the user's length.

3. OUT-OF-SCOPE HANDLING (CRITICAL):
   - NON-HEALTH QUERIES: If the user asks about anything unrelated to health or diseases (nonsense, general talk, irrelevant topics), give a full, formal, and friendly refusal. Politely explain that you are a health consultant and cannot discuss other topics.
   - HEALTH QUERIES NOT IN DATABASE: If the user asks a medical or "Hikmat" question that is NOT in your knowledge base, you MUST respond with this specific logic:
     "Main aapko tajweez (suggestion) toh de sakta hoon magar mere knowledge base mein is se mutaliq koi makhsoos maloomat mojood nahi hain, is liye in par amal karna risky/khatarnak ho sakta hai." (Adapt this to the user's language: Urdu Script, Roman Urdu, or English).

4. FORMATTING & STYLE:
   - Use PLAIN TEXT ONLY. NO markdown symbols (**, *, #, etc.).
   - Mirror the user's greeting (e.g., Asalam-o-Alaikum -> Walaikum Assalam).
   - Maintain a "ChatGPT-like" smooth and professional flow.

5. SAFETY:
   - Never provide medical dosages or specific drug names unless they are explicitly mentioned in the context.`,
      },
      ...history,
      {
        role: "user",
        content: `CONTEXT FROM KNOWLEDGE BASE:
"""
${context}
"""

USER QUERY: ${question}`,
      },
    ];

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages,
      temperature: 0.5, // Lower temperature for more exact and reliable responses
      max_tokens: 1000,
    });

    return completion.choices[0].message.content;

  } catch (err) {
    console.error("Groq Error:", err.message);
    return "Maaf kijiye, system mein masla aa gaya hai.";
  }
};