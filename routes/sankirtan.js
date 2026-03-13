import express from "express";
import SankirtanLog from "../models/SankirtanLog.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/sankirtan - Get user's sankirtan logs
router.get("/", protect, async (req, res) => {
    try {
        const logs = await SankirtanLog.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .lean();

        const formatted = logs.map(l => ({ ...l, id: l._id }));
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/sankirtan/leaderboard - Get general leaderboard
router.get("/leaderboard", protect, async (req, res) => {
    try {
        const users = await User.find()
            .populate('batchId', 'name')
            .lean();

        const leaderboard = await Promise.all(users.map(async user => {
            const logs = await SankirtanLog.find({
                userId: user._id,
                status: "approved"
            }).lean();

            const totalPoints = logs.reduce((sum, log) => sum + (log.points || 0), 0);
            return {
                id: user._id,
                name: user.spiritualName || user.displayName,
                points: totalPoints,
                batch: user.batchId ? user.batchId.name : null
            };
        }));

        const sorted = leaderboard
            .filter(u => u.points > 0)
            .sort((a, b) => b.points - a.points);

        res.json(sorted);
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

        const log = await SankirtanLog.create({
            userId: req.user.id,
            mahaBig: mb,
            big: b,
            medium: m,
            small: s,
            points: points,
            location: location || "",
            status: "pending"
        });

        res.status(201).json({ ...log.toObject(), id: log._id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/sankirtan/pending - Get pending logs for Guide approval
router.get("/pending", protect, async (req, res) => {
    try {
        const logs = await SankirtanLog.find({ status: "pending" })
            .populate('userId', 'displayName spiritualName')
            .sort({ createdAt: -1 })
            .lean();

        const formatted = logs.map(l => ({
            ...l,
            id: l._id,
            user: l.userId ? { ...l.userId, id: l.userId._id } : null
        }));

        res.json(formatted);
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

        const updatedLog = await SankirtanLog.findByIdAndUpdate(
            logId,
            { status: action === "approve" ? "approved" : "rejected" },
            { new: true }
        ).lean();

        res.json({ ...updatedLog, id: updatedLog._id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
