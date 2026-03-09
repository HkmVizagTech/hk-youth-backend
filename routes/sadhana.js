import express from "express";
import Sadhana from "../models/Sadhana.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/sadhana — My logs (last 30 days)
router.get("/", protect, async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const logs = await Sadhana.find({ user: req.user.id, date: { $gte: since } }).sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/sadhana — Create/update today's log (upsert)
router.post("/", protect, async (req, res) => {
  try {
    const { date, japaRounds, readingMinutes, morningArati, eveningArati, notes } = req.body;
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const log = await Sadhana.findOneAndUpdate(
      { user: req.user.id, date: dayStart },
      { japaRounds, readingMinutes, morningArati, eveningArati, notes },
      { upsert: true, new: true }
    );
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
