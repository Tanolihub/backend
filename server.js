import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import chatRoute from "./routes/chat.js";

dotenv.config();

const app = express();

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Digital Hakeem Backend is running!");
});
app.use("/chat", chatRoute);

// Server start
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});