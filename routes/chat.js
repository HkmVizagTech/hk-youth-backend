import express from "express";
import { prisma } from "../lib/providers.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/chat — My threads
router.get("/", protect, async (req, res) => {
  try {
    const threads = await prisma.thread.findMany({
      where: {
        participants: {
          some: { id: req.user.id }
        }
      },
      orderBy: { updatedAt: "desc" },
      include: {
        participants: {
          select: { id: true, displayName: true, spiritualName: true }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" }
        }
      }
    });
    res.json(threads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/chat/:threadId — Thread messages
router.get("/:threadId", protect, async (req, res) => {
  try {
    const thread = await prisma.thread.findUnique({
      where: { id: req.params.threadId },
      include: {
        participants: {
          select: { id: true, displayName: true, spiritualName: true }
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: { select: { id: true, displayName: true, spiritualName: true } }
          }
        }
      }
    });
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

    const thread = await prisma.thread.create({
      data: {
        name: name || "",
        isGroup: isGroup || false,
        participants: {
          connect: allParticipants.map(id => ({ id }))
        }
      },
      include: {
        participants: {
          select: { id: true, displayName: true, spiritualName: true }
        }
      }
    });
    res.status(201).json(thread);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
