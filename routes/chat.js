import express from "express";
import Thread from "../models/Thread.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/chat — My threads
router.get("/", protect, async (req, res) => {
  try {
    const threads = await Thread.find({ participants: req.user.id })
      .sort({ updatedAt: -1 })
      .populate("participants", "name spiritualName avatarSeed username");
    res.json(threads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/chat/:threadId — Thread messages
router.get("/:threadId", protect, async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.threadId)
      .populate("participants", "name spiritualName avatarSeed")
      .populate("messages.sender", "name spiritualName avatarSeed");
    if (!thread) return res.status(404).json({ message: "Thread not found" });
    res.json(thread);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/chat/thread — Create DM/group thread
router.post("/thread", protect, async (req, res) => {
  try {
    const { participantIds, name, isGroup } = req.body;
    const allParticipants = [...new Set([req.user.id, ...participantIds])];
    const thread = await Thread.create({ participants: allParticipants, name: name || "", isGroup: isGroup || false });
    await thread.populate("participants", "name spiritualName avatarSeed username");
    res.status(201).json(thread);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
