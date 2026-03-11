import express from "express";
import { prisma } from "../lib/providers.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/sankirtan - Get user's sankirtan logs
router.get("/", protect, async (req, res) => {
    try {
        const logs = await prisma.sankirtanLog.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: "desc" }
        });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/sankirtan/leaderboard - Get general leaderboard
router.get("/leaderboard", protect, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                sankirtanLogs: {
                    where: { status: "approved" }
                }
            }
        });

        const leaderboard = users.map(user => {
            const totalPoints = user.sankirtanLogs.reduce((sum, log) => sum + log.points, 0);
            return {
                id: user.id,
                name: user.spiritualName || user.displayName,
                points: totalPoints,
                batch: user.batch?.name
            };
        })
            .filter(u => u.points > 0)
            .sort((a, b) => b.points - a.points);

        res.json(leaderboard);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/sankirtan - Submit new log
router.post("/", protect, async (req, res) => {
    try {
        const { mahaBig, big, medium, small, location } = req.body;

        // Validate inputs
        const mb = parseInt(mahaBig) || 0;
        const b = parseInt(big) || 0;
        const m = parseInt(medium) || 0;
        const s = parseInt(small) || 0;

        const points = (mb * 20) + (b * 10) + (m * 5) + (s * 2);

        const log = await prisma.sankirtanLog.create({
            data: {
                userId: req.user.id,
                mahaBig: mb,
                big: b,
                medium: m,
                small: s,
                points: points,
                location: location || "",
                status: "pending"
            }
        });
        res.status(201).json(log);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/sankirtan/pending - Get pending logs for Guide approval
router.get("/pending", protect, async (req, res) => {
    try {
        const logs = await prisma.sankirtanLog.findMany({
            where: { status: "pending" },
            include: {
                user: { select: { id: true, displayName: true, spiritualName: true } }
            },
            orderBy: { createdAt: "desc" }
        });
        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/sankirtan/approve/:id - Approve or reject log
router.post("/approve/:id", protect, async (req, res) => {
    try {
        const { action } = req.body; // "approve" or "reject"
        const logId = req.params.id;

        if (action !== "approve" && action !== "reject") {
            return res.status(400).json({ message: "Invalid action" });
        }

        const updatedLog = await prisma.sankirtanLog.update({
            where: { id: logId },
            data: { status: action === "approve" ? "approved" : "rejected" }
        });

        res.json(updatedLog);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
