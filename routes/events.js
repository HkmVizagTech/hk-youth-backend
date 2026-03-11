import express from "express";
import { prisma } from "../lib/providers.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/events
router.get("/", protect, async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { startTime: "asc" },
      include: {
        registrations: {
          select: { userId: true, status: true }
        }
      }
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/events — Guide/Admin only
router.post("/", protect, requireRole("guide", "admin", "folk_guide", "folk_admin"), async (req, res) => {
  try {
    const { title, description, startTime, endTime, scope, centerId, batchId } = req.body;
    const event = await prisma.event.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        scope: scope || 'center',
        centerId,
        batchId
      }
    });
    req.app.get("io").emit("new_event", event);
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/events/:id/register — Toggle registration
router.post("/:id/register", protect, async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: { registrations: true }
    });
    if (!event) return res.status(404).json({ message: "Event not found" });

    const existing = await prisma.eventRegistration.findFirst({
      where: { eventId: req.params.id, userId: req.user.id }
    });

    if (existing) {
      await prisma.eventRegistration.delete({ where: { id: existing.id } });
      res.json({ registered: false });
    } else {
      await prisma.eventRegistration.create({
        data: { eventId: req.params.id, userId: req.user.id }
      });
      res.json({ registered: true });
    }

    const count = await prisma.eventRegistration.count({ where: { eventId: req.params.id } });
    req.app.get("io").emit("event_updated", { eventId: event.id, registeredCount: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
