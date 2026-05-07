import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import chatRoute from "./routes/chat.js";

// .env file se configuration load karna
dotenv.config();

const app = express();

/**
 * 🍃 MONGODB CONNECTION
 * Hum yahan MongoDB se connect ho rahy hain ta k chat history save kar saken.
 */
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

/**
 * 🛠 MIDDLEWARES
 * CORS: Frontend ko backend se baat karny ki ijazat dena.
 * JSON: Body parser ta k hum JSON data read kar saken.
 */
app.use(cors());
app.use(express.json());

/**
 * 🛣 ROUTES
 * '/' -> Bas ye check karny k liye k server chal raha hai.
 * '/chat' -> Chat ki sari logic is route ma hai.
 */
app.get("/", (req, res) => {
  res.send("Digital Hakeem Backend is running!");
});

app.use("/chat", chatRoute);

/**
 * 🚀 SERVER START
 * Server ko specify kiye gaye port par on karna.
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
