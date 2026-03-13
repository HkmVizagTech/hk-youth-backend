import express from "express";
import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import SankirtanLog from "../models/SankirtanLog.js";
import SadhanaLog from "../models/SadhanaLog.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Record a QR scan
router.post("/check-in", protect, async (req, res) => {
    try {
        const { devoteeId, type, status, location } = req.body;
        // The scanner is the authenticated user (guard/head/admin)
        const scannerId = req.user.id;

        // Validate devotee exists
        const devotee = await User.findById(devoteeId);
        if (!devotee) return res.status(404).json({ message: "Devotee not found" });

        // Check if recently checked in (prevent duplicates)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recent = await Attendance.findOne({
            userId: devoteeId,
            type: type || "Daily",
            checkInTime: { $gt: oneHourAgo }
        });

        if (recent) {
            return res.status(400).json({
                message: "Already checked in recently",
                data: recent
            });
        }

        const attendance = await Attendance.create({
            userId: devoteeId,
            scannerId: scannerId,
            type: type || "Daily",
            status: status || "Present",
            location: location || "Main Hall"
        });

        const populated = await Attendance.findById(attendance._id)
            .populate('userId', 'displayName spiritualName role')
            .lean();

        const formatted = {
            ...populated,
            id: populated._id,
            user: { ...populated.userId, id: populated.userId._id }
        };

        // Emit live event
        const io = req.app.get("io");
        if (io) {
            io.emit("attendance_update", formatted);
        }

        res.status(201).json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get attendance history for a specific member or all if admin
router.get("/history", protect, async (req, res) => {
    try {
        const { devoteeId } = req.query;
        // Security/Admin can see all, Member only sees their own
        const isMember = ['folk_member', 'youth'].includes(req.user.role);

        const filter = isMember
            ? { userId: req.user.id }
            : (devoteeId ? { userId: devoteeId } : {});

        const history = await Attendance.find(filter)
            .populate('userId', 'displayName spiritualName')
            .sort({ checkInTime: -1 })
            .limit(50)
            .lean();

        const formatted = history.map(h => ({
            ...h,
            id: h._id,
            user: { ...h.userId, id: h.userId._id }
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get daily stats for admin
router.get("/stats", protect, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [count, pendingSankirtan, sankirtanLogs, sadhanaLogs] = await Promise.all([
            Attendance.countDocuments({ checkInTime: { $gte: today } }),
            SankirtanLog.countDocuments({ status: "pending" }),
            SankirtanLog.find({ status: "approved" }, 'points').lean(),
            SadhanaLog.find({ date: { $gte: today } }, 'japaRounds').lean()
        ]);

        const totalSankirtanPts = sankirtanLogs.reduce((sum, log) => sum + (log.points || 0), 0);
        const avgJapa = sadhanaLogs.length > 0
            ? (sadhanaLogs.reduce((sum, log) => sum + (log.japaRounds || 0), 0) / sadhanaLogs.length).toFixed(1)
            : "0";

        res.json({
            todayCount: count,
            pendingSankirtan,
            totalSankirtanPts,
            avgJapa
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
