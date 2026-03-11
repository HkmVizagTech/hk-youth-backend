import jwt from "jsonwebtoken";
import { prisma } from "../lib/providers.js";

export const setupSockets = (io) => {
  // Auth middleware for sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    console.log(`🔌 User connected: ${socket.user.username} (${socket.id})`);

    // Join user's personal room (for direct notifications)
    socket.join(`user:${userId}`);

    // ── Chat ───────────────────────────────────────────────
    socket.on("join_thread", (threadId) => {
      socket.join(`thread:${threadId}`);
    });

    socket.on("leave_thread", (threadId) => {
      socket.leave(`thread:${threadId}`);
    });

    socket.on("send_message", async ({ threadId, text }) => {
      try {
        const message = await prisma.message.create({
          data: {
            content: text,
            threadId: threadId,
            senderId: userId
          },
          include: {
            sender: { select: { id: true, displayName: true, spiritualName: true } }
          }
        });

        await prisma.thread.update({
          where: { id: threadId },
          data: { lastMessage: text, updatedAt: new Date() }
        });

        // Emit to all users in this chat thread room
        io.to(`thread:${threadId}`).emit("receive_message", { threadId, message });
      } catch (err) {
        socket.emit("error", { message: err.message });
      }
    });

    // ── Typing indicators ──────────────────────────────────
    socket.on("typing", ({ threadId }) => {
      socket.to(`thread:${threadId}`).emit("user_typing", { userId, name: socket.user.name });
    });

    socket.on("stop_typing", ({ threadId }) => {
      socket.to(`thread:${threadId}`).emit("user_stop_typing", { userId });
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Disconnected: ${socket.user.username}`);
    });
  });
};
