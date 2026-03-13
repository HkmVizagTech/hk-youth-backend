import express from "express";
import SadhanaLog from "../models/SadhanaLog.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/sadhana — My logs (last 30 days)
router.get("/", protect, async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const logs = await SadhanaLog.find({
      userId: req.user.id,
      date: { $gte: since }
    })
      .sort({ date: -1 })
      .lean();

    const formatted = logs.map(l => ({ ...l, id: l._id }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/sadhana — Create/update today's log (upsert)
router.post("/", protect, async (req, res) => {
  try {
    const { date, japaRounds, readingTime, hearingTime, sevaTime, wokeUpAt, sleptAt, principlesFollowed } = req.body;
    const logDate = new Date(date || Date.now());
    logDate.setHours(0, 0, 0, 0);

    const log = await SadhanaLog.findOneAndUpdate(
      { userId: req.user.id, date: logDate },
      {
        japaRounds, readingTime, hearingTime, sevaTime,
        wokeUpAt, sleptAt, principlesFollowed
      },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    res.json({ ...log, id: log._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
