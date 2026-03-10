import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import chatRoutes from "./routes/chat.js";
import eventRoutes from "./routes/events.js";
import sadhanaRoutes from "./routes/sadhana.js";
import communityRoutes from "./routes/community.js";
import couponRoutes from "./routes/coupons.js";
import { setupSockets } from "./sockets/index.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());

// ── REST Routes ─────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/sadhana", sadhanaRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/coupons", couponRoutes);

app.get("/", (req, res) => res.json({ status: "Hare Krishna Youth API Running 🙏" }));

// ── Attach io to app for use in route handlers ───────────────
app.set("io", io);

// ── Real-Time Sockets ────────────────────────────────────────
setupSockets(io);

// ── Database & Start ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });
