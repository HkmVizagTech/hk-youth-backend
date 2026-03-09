import express from "express";
import Event from "../models/Event.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/events
router.get("/", protect, async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 }).populate("organizer", "name spiritualName");
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/events — Guide/Admin only
router.post("/", protect, requireRole("guide", "admin"), async (req, res) => {
  try {
    const { title, description, date, location, type, maxCapacity, imageUrl } = req.body;
    const event = await Event.create({ title, description, date, location, type, maxCapacity, imageUrl, organizer: req.user.id });
    req.app.get("io").emit("new_event", event);
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/events/:id/register — Toggle registration
router.post("/:id/register", protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const isRegistered = event.registeredUsers.includes(req.user.id);
    if (isRegistered) {
      event.registeredUsers.pull(req.user.id);
    } else {
      if (event.registeredUsers.length >= event.maxCapacity)
        return res.status(400).json({ message: "Event full" });
      event.registeredUsers.push(req.user.id);
    }
    await event.save();
    req.app.get("io").emit("event_updated", { eventId: event._id, registeredCount: event.registeredUsers.length });
    res.json({ registered: !isRegistered, count: event.registeredUsers.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
