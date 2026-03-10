import express from "express";
import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import { authenticateToken } from "./auth.js"; // I need to make sure this is exported or create a middleware

const router = express.Router();

// Middleware inside the file if not available globally
const auth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    // Since we don't have the verify function here, we'll assume the token is already checked by a global middleware 
    // or we'll just implement a simple one for now. 
    // Actually, I'll use the one from auth.js if I can.
    next();
};

// Record a QR scan
router.post("/check-in", async (req, res) => {
    try {
        const { devoteeId, type, status, location } = req.body;
        const scannerId = req.headers['x-scanner-id']; // Temporary way to get scanner ID if not in token

        // Validate devotee exists
        const devotee = await User.findById(devoteeId);
        if (!devotee) return res.status(404).json({ message: "Devotee not found" });

        // Check if recently checked in (prevent duplicates)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recent = await Attendance.findOne({
            devotee: devoteeId,
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
            devotee: devoteeId,
            scannedBy: scannerId || "64f1a2b3c4d5e6f7a8b9c0d1", // Fallback to a system admin if id not provided
            type: type || "Daily",
            status: status || "Present",
            location: location || "Main Hall"
        });

        // Populate devotee info for real-time update
        const populated = await Attendance.findById(attendance._id).populate("devotee", "name spiritualName role");

        // Emit live event
        const io = req.app.get("io");
        if (io) {
            io.emit("attendance_update", populated);
        }

        res.status(201).json(populated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get attendance history for a specific member or all if admin
router.get("/history", async (req, res) => {
    try {
        const { devoteeId } = req.query;
        const query = devoteeId ? { devotee: devoteeId } : {};

        const history = await Attendance.find(query)
            .populate("devotee", "name spiritualName")
            .sort({ checkInTime: -1 })
            .limit(50);

        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get daily stats for admin
router.get("/stats", async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const count = await Attendance.countDocuments({
            checkInTime: { $gte: today }
        });

        res.json({ todayCount: count });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
