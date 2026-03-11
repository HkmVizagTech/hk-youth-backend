import express from "express";
import { prisma } from "../lib/providers.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Record a QR scan
router.post("/check-in", protect, async (req, res) => {
    try {
        const { devoteeId, type, status, location } = req.body;
        // The scanner is the authenticated user (guard/head/admin)
        const scannerId = req.user.id;

        // Validate devotee exists
        const devotee = await prisma.user.findUnique({ where: { id: devoteeId } });
        if (!devotee) return res.status(404).json({ message: "Devotee not found" });

        // Check if recently checked in (prevent duplicates)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recent = await prisma.attendance.findFirst({
            where: {
                userId: devoteeId,
                type: type || "Daily",
                checkInTime: { gt: oneHourAgo }
            }
        });

        if (recent) {
            return res.status(400).json({
                message: "Already checked in recently",
                data: recent
            });
        }

        const attendance = await prisma.attendance.create({
            data: {
                userId: devoteeId,
                scannerId: scannerId,
                type: type || "Daily",
                status: status || "Present",
                location: location || "Main Hall"
            },
            include: {
                user: { select: { id: true, displayName: true, spiritualName: true, role: true } }
            }
        });

        // Emit live event
        const io = req.app.get("io");
        if (io) {
            io.emit("attendance_update", attendance);
        }

        res.status(201).json(attendance);
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

        const where = isMember
            ? { userId: req.user.id }
            : (devoteeId ? { userId: devoteeId } : {});

        const history = await prisma.attendance.findMany({
            where,
            include: { user: { select: { id: true, displayName: true, spiritualName: true } } },
            orderBy: { checkInTime: "desc" },
            take: 50
        });

        res.json(history);
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
            prisma.attendance.count({ where: { checkInTime: { gte: today } } }),
            prisma.sankirtanLog.count({ where: { status: "pending" } }),
            prisma.sankirtanLog.findMany({ where: { status: "approved" }, select: { points: true } }),
            prisma.sadhanaLog.findMany({ where: { date: { gte: today } }, select: { japaRounds: true } })
        ]);

        const totalSankirtanPts = sankirtanLogs.reduce((sum, log) => sum + log.points, 0);
        const avgJapa = sadhanaLogs.length > 0
            ? (sadhanaLogs.reduce((sum, log) => sum + log.japaRounds, 0) / sadhanaLogs.length).toFixed(1)
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
