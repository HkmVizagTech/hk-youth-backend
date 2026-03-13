import express from "express";
import Thread from "../models/Thread.js";
import Message from "../models/Message.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/chat — My threads
router.get("/", protect, async (req, res) => {
  try {
    const threads = await Thread.find({
      participantIds: req.user.id
    })
      .sort({ updatedAt: -1 })
      .populate('participantIds', 'displayName spiritualName')
      .lean();

    const formattedThreads = await Promise.all(threads.map(async thread => {
      const lastMsg = await Message.findOne({ threadId: thread._id })
        .sort({ createdAt: -1 })
        .lean();

      return {
        ...thread,
        id: thread._id,
        participants: thread.participantIds.map(p => ({ ...p, id: p._id })),
        messages: lastMsg ? [lastMsg] : []
      };
    }));

    res.json(formattedThreads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/chat/:threadId — Thread messages
router.get("/:threadId", protect, async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.threadId)
      .populate('participantIds', 'displayName spiritualName')
      .lean();

    if (!thread) return res.status(404).json({ message: "Thread not found" });

    const messages = await Message.find({ threadId: req.params.threadId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'displayName spiritualName')
      .lean();

    const formattedThread = {
      ...thread,
      id: thread._id,
      participants: thread.participantIds.map(p => ({ ...p, id: p._id })),
      messages: messages.map(m => ({
        ...m,
        id: m._id,
        sender: m.senderId ? { ...m.senderId, id: m.senderId._id } : null
      }))
    };

    res.json(formattedThread);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/chat/thread — Create DM/group thread
router.post("/thread", protect, async (req, res) => {
  try {
    const { participantIds, name, isGroup } = req.body;
    const allParticipants = [...new Set([req.user.id, ...participantIds])];

    const thread = await Thread.create({
      name: name || "",
      isGroup: isGroup || false,
      participantIds: allParticipants
    });

    const populatedThread = await Thread.findById(thread._id)
      .populate('participantIds', 'displayName spiritualName')
      .lean();

    const formattedThread = {
      ...populatedThread,
      id: populatedThread._id,
      participants: populatedThread.participantIds.map(p => ({ ...p, id: p._id }))
    };

    res.status(201).json(formattedThread);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
