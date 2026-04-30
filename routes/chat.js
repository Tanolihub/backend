import express from "express";
import mongoose from "mongoose";
import { getAIResponse } from "../services/rag.js";
import { ChatSession } from "../models/Chat.js";

const router = express.Router();

// 1. Get ALL Sessions for a User
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

// 2. Get full messages for a SPECIFIC Session
router.get("/messages/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    // Check if ID is valid MongoDB format
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ success: false, error: "Invalid session ID format" });
    }
    const session = await ChatSession.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, error: "Session not found" });
    
    res.json({ success: true, messages: session.messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Delete a Session
router.delete("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ success: false, error: "Invalid session ID format" });
    }
    await ChatSession.findByIdAndDelete(sessionId);
    res.json({ success: true, message: "Session deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Main Chat Route
router.post("/", async (req, res) => {
  try {
    const { message, userId, sessionId } = req.body; 

    if (!userId) return res.status(400).json({ success: false, error: "userId is required" });

    let session = null;

    // Safety Check: Only search by ID if it's a valid MongoDB ObjectId
    if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
      session = await ChatSession.findById(sessionId);
    }

    // If no valid session found, create a NEW one
    if (!session) {
      session = new ChatSession({ 
        userId, 
        messages: [],
        title: message ? (message.substring(0, 30) + (message.length > 30 ? "..." : "")) : "New Chat"
      });
    }

    const historyForAI = session.messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }));

    const answer = await getAIResponse(message, historyForAI);

    session.messages.push({ role: "user", content: message });
    session.messages.push({ role: "assistant", content: answer });
    session.lastUpdated = Date.now();
    await session.save();

    res.json({
      success: true,
      answer,
      sessionId: session._id 
    });

  } catch (err) {
    console.error("Chat Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
