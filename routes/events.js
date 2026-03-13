import express from "express";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/events
router.get("/", protect, async (req, res) => {
  try {
    const events = await Event.find()
      .sort({ startTime: 1 })
      .lean();

    const formatted = await Promise.all(events.map(async event => {
      const registrations = await EventRegistration.find({ eventId: event._id }, 'userId status').lean();
      return {
        ...event,
        id: event._id,
        registrations: registrations.map(r => ({ ...r, id: r._id }))
      };
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/events — Guide/Admin only
router.post("/", protect, requireRole("guide", "admin", "folk_guide", "folk_admin"), async (req, res) => {
  try {
    const { title, description, startTime, endTime, scope, centerId, batchId } = req.body;
    const event = await Event.create({
      title,
      description,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      scope: scope || 'center',
      centerId: centerId || null,
      batchId: batchId || null
    });

    const formatted = { ...event.toObject(), id: event._id };

    req.app.get("io").emit("new_event", formatted);
    res.status(201).json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/events/:id/register — Toggle registration
router.post("/:id/register", protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const existing = await EventRegistration.findOne({
      eventId: req.params.id,
      userId: req.user.id
    });

    let registered = false;
    if (existing) {
      await EventRegistration.deleteOne({ _id: existing._id });
      registered = false;
    } else {
      await EventRegistration.create({
        eventId: req.params.id,
        userId: req.user.id
      });
      registered = true;
    }

    const count = await EventRegistration.countDocuments({ eventId: req.params.id });
    req.app.get("io").emit("event_updated", { eventId: event._id, registeredCount: count });

    res.json({ registered });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
