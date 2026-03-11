import express from "express";
import { prisma } from "../lib/providers.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/sadhana — My logs (last 30 days)
router.get("/", protect, async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const logs = await prisma.sadhanaLog.findMany({
      where: {
        userId: req.user.id,
        date: { gte: since }
      },
      orderBy: { date: "desc" }
    });
    res.json(logs);
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

    const log = await prisma.sadhanaLog.upsert({
      where: {
        userId_date: {
          userId: req.user.id,
          date: logDate
        }
      },
      update: { japaRounds, readingTime, hearingTime, sevaTime, wokeUpAt, sleptAt, principlesFollowed },
      create: {
        userId: req.user.id,
        date: logDate,
        japaRounds, readingTime, hearingTime, sevaTime, wokeUpAt, sleptAt, principlesFollowed
      }
    });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
