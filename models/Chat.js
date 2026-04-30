import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const sessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, default: "New Conversation" },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
});

export const ChatSession = mongoose.model("ChatSession", sessionSchema);
