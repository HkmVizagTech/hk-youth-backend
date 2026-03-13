import express from "express";
import Coupon from "../models/Coupon.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/coupons (Admin: all, Member: their own)
router.get("/", protect, async (req, res) => {
    try {
        let filter = {};
        if (['folk_member', 'youth'].includes(req.user.role)) {
            filter.assignedTo = req.user.id;
        }
        const coupons = await Coupon.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        const formatted = coupons.map(c => ({
            ...c,
            id: c._id
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/coupons (Admin/Guide only)
router.post("/", protect, requireRole("admin", "guide", "folk_admin", "folk_guide"), async (req, res) => {
    try {
        const { code, type, event, expiryDate, assignedTo } = req.body;
        const coupon = await Coupon.create({
            code,
            type,
            event,
            expiryDate: new Date(expiryDate),
            assignedTo: assignedTo || null
        });

        const formatted = { ...coupon.toObject(), id: coupon._id };

        // Broadcast creation to admins or assigned user
        req.app.get("io").emit("new_coupon", formatted);
        res.status(201).json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/coupons/:id/use (Mark as used)
router.put("/:id/use", protect, async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ message: "Not found" });

        // allow security/admin/guide to scan and mark used
        if (!["admin", "head", "security", "guide", "folk_admin", "folk_guide"].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        coupon.isUsed = true;
        await coupon.save();

        const formatted = { ...coupon.toObject(), id: coupon._id };

        req.app.get("io").emit("coupon_used", formatted);
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
