import express from "express";
import mongoose from "mongoose";
import { getAIResponse } from "../services/rag.js";
import { ChatSession } from "../models/Chat.js";

const router = express.Router();

/**
 * 1. GET ALL SESSIONS
 * Kisi bhi user ki sari purani chats (sessions) ki list nikaalna.
 */
router.get("/sessions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const sessions = await ChatSession.find({ userId })
      .select("title lastUpdated")
      .sort({ lastUpdated: -1 });
    
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 2. GET SESSION MESSAGES
 * Kisi aik specific chat k andar k saary messages read karna.
 */
router.get("/messages/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ success: false, error: "Invalid session ID" });
    }
    const session = await ChatSession.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, error: "Session not found" });
    
    res.json({ success: true, messages: session.messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 3. DELETE SESSION
 * Chat session ko delete karna.
 */
router.delete("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ success: false, error: "Invalid session ID" });
    }
    await ChatSession.findByIdAndDelete(sessionId);
    res.json({ success: true, message: "Session deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 4. 🌟 MAIN CHAT ROUTE (POST)
 * Jab user koi naya message bhejta hai, to ye route chalta hai.
 */
router.post("/", async (req, res) => {
  try {
    const { message, userId, sessionId } = req.body; 

    if (!userId) return res.status(400).json({ success: false, error: "userId is required" });

    let session = null;

    // A. Session dhoondo ya naya banao
    if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
      session = await ChatSession.findById(sessionId);
    }

    if (!session) {
      session = new ChatSession({ 
        userId, 
        messages: [],
        title: message ? (message.substring(0, 30) + (message.length > 30 ? "..." : "")) : "New Chat"
      });
    }

    // B. AI k liye history tyar karna
    const historyForAI = session.messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }));

    // C. AI RESPONSE LENA (GA Optimization isi k andar hoti hai)
    const answer = await getAIResponse(message, historyForAI);

    // D. Chat history save karna
    session.messages.push({ role: "user", content: message });
    session.messages.push({ role: "assistant", content: answer });
    session.lastUpdated = Date.now();
    await session.save();

    // E. Jawaab bhej dena
    res.json({
      success: true,
      answer,
      sessionId: session._id 
    });

  } catch (err) {
    console.error("Backend Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
