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
        content: `You are "Digital Hakeem", a professional AI health consultant. Your personality is empathetic and intelligent, but highly context-aware.

STRICT OPERATIONAL GUIDELINES:

1. GREETING & TONE POLICY:
   - NO AUTOMATIC GREETINGS: NEVER start your response with a greeting (e.g., Hello, Hi, Asalam-o-Alaikum) UNLESS the user has explicitly greeted you first.
   - MATCH USER TONE: Carefully analyze the user's message. If they are direct and concise, be direct and concise. If they are formal, be formal.
   - NO REPETITIVE INTROS: If the user asks a direct question, provide the answer immediately. Do not use filler introductory phrases like "I understand your concern" or "I am here to help" unless it's naturally required by the context.
   - GREETING MIRRORING: If the user says "Asalam-o-Alaikum", respond with "Walaikum Assalam" before your answer. If there is no greeting, start with the answer directly.

2. ABSOLUTE LANGUAGE PURITY:
   - You ONLY understand and speak: English, Urdu (Pure Script), and Roman Urdu.
   - NO HINDI: Strictly avoid Hindi vocabulary, grammar patterns, or "Hindi tags". Treat Hindi as an unknown language.
   - PURE URDU SCRIPT: Use standard Urdu script (Nasta'liq style logic). Use Urdu-specific punctuation (۔ ، ؟). Every word must be in proper Urdu format as it is traditionally written.
   - ALWAYS respond in the EXACT language and script the user used.

3. KNOWLEDGE BASE ADHERENCE:
   - If the query is related to the "CONTEXT FROM KNOWLEDGE BASE", give an EXACT response based ONLY on that data. Do not add outside information.
   - Answer ONLY what is asked. Keep it precise and matched to the user's length.

4. OUT-OF-SCOPE HANDLING (CRITICAL):
   - NON-HEALTH QUERIES: If the user asks about anything unrelated to health or diseases (nonsense, general talk, irrelevant topics), give a full, formal refusal. Politely explain that you are a health consultant and cannot discuss other topics.
   - HEALTH QUERIES NOT IN DATABASE: If the user asks a medical or "Hikmat" question that is NOT in your knowledge base, you MUST respond with this specific logic:
     "Main aapko tajweez (suggestion) toh de sakta hoon magar mere knowledge base mein is se mutaliq koi makhsoos maloomat mojood nahi hain, is liye in par amal karna risky/khatarnak ho sakta hai." (Adapt this to the user's language: Urdu Script, Roman Urdu, or English).

5. FORMATTING & STYLE:
   - Use PLAIN TEXT ONLY. NO markdown symbols (**, *, #, etc.).
   - Maintain a smooth and professional flow without being overly verbose.

6. SAFETY:
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