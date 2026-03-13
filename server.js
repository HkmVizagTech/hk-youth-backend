import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { prisma } from "./lib/providers.js";

import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import chatRoutes from "./routes/chat.js";
import eventRoutes from "./routes/events.js";
import sadhanaRoutes from "./routes/sadhana.js";
import communityRoutes from "./routes/community.js";
import couponRoutes from "./routes/coupons.js";
import attendanceRoutes from "./routes/attendance.js";
import sankirtanRoutes from "./routes/sankirtan.js";
import { setupSockets } from "./sockets/index.js";


const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Log every request
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ── REST Routes ─────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/sadhana", sadhanaRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/sankirtan", sankirtanRoutes);

app.get("/", (req, res) => res.json({ status: "FOLK HKM Vizag API Running 🙏" }));

// ── DEV ONLY: Read OTP from in-memory store ───────────────────
if (process.env.NODE_ENV !== 'production') {
  import('./lib/providers.js').then(({ redis }) => {
    app.get('/api/dev/otp/:identifier', async (req, res) => {
      const otp = await redis.get(`otp:${req.params.identifier}`);
      res.json({ otp: otp || null });
    });
  });
}

// ── Attach io to app for use in route handlers ───────────────
app.set("io", io);

// ── Real-Time Sockets ────────────────────────────────────────
setupSockets(io);

// ── Start Server ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🙏 All Glories to Srila Prabhupada!`);
});

