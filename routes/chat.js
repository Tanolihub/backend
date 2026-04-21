import express from "express";
import { getAIResponse } from "../services/rag.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message, history } = req.body; // history should be an array of {role, content}

    const answer = await getAIResponse(message, history || []);

    res.json({
      success: true,
      answer,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

export default router;