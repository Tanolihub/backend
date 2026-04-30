import express from "express";
import { getAIResponse } from "../services/rag.js";
import { ChatSession } from "../models/Chat.js";

const router = express.Router();

// 1. Get ALL Sessions for a User (List of chats)
router.get("/sessions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    // Sirf id, title aur date return karenge (messages nahi taake response fast ho)
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
    await ChatSession.findByIdAndDelete(sessionId);
    res.json({ success: true, message: "Session deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Main Chat Route (Create or Continue a session)
router.post("/", async (req, res) => {
  try {
    const { message, userId, sessionId } = req.body; 

    if (!userId) return res.status(400).json({ success: false, error: "userId is required" });

    let session;

    // Check if we are continuing an old session or starting a new one
    if (sessionId) {
      session = await ChatSession.findById(sessionId);
    }

    // If no sessionId or session not found, create a NEW one
    if (!session) {
      session = new ChatSession({ 
        userId, 
        messages: [],
        title: message.substring(0, 30) + (message.length > 30 ? "..." : "") // Use first msg as title
      });
    }

    // AI context (last 10 messages)
    const historyForAI = session.messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    }));

    const answer = await getAIResponse(message, historyForAI);

    // Save to DB
    session.messages.push({ role: "user", content: message });
    session.messages.push({ role: "assistant", content: answer });
    session.lastUpdated = Date.now();
    await session.save();

    res.json({
      success: true,
      answer,
      sessionId: session._id // Return sessionId so frontend can use it for next msgs
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
