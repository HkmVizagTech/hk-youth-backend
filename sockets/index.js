import jwt from "jsonwebtoken";
import Message from "../models/Message.js";
import Thread from "../models/Thread.js";

export const setupSockets = (io) => {
  const DEFAULT_ADMIN_ID = "69b3b15231109afc1b41d619";

  io.on("connection", (socket) => {
    // Inject default user for all socket connections
    socket.user = {
      id: DEFAULT_ADMIN_ID,
      role: "folk_admin",
      name: "Temple Admin"
    };

    const userId = socket.user.id;

    console.log(`🔌 User connected: ${socket.user.name || 'Unknown'} (${socket.id})`);

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
        const message = await Message.create({
          content: text,
          threadId: threadId,
          senderId: userId
        });

        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'displayName spiritualName')
          .lean();

        const formattedMessage = {
          ...populatedMessage,
          id: populatedMessage._id,
          sender: { ...populatedMessage.senderId, id: populatedMessage.senderId._id }
        };

        await Thread.findByIdAndUpdate(threadId, {
          lastMessage: text,
          updatedAt: new Date()
        });

        // Emit to all users in this chat thread room
        io.to(`thread:${threadId}`).emit("receive_message", { threadId, message: formattedMessage });
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
      console.log(`🔌 Disconnected: ${socket.user.name || 'Unknown'}`);
    });
  });
};
