import express from "express";
import Coupon from "../models/Coupon.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/coupons (Admin: all, Member: their own)
router.get("/", protect, async (req, res) => {
    try {
        let filter = {};
        if (["youth", "member"].includes(req.user.role)) {
            filter.assignedTo = req.user.id;
        }
        const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
        res.json(coupons);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/coupons (Admin/Head only)
router.post("/", protect, async (req, res) => {
    if (!["admin", "head"].includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
    }
    try {
        const { code, type, event, expiryDate, assignedTo } = req.body;
        const coupon = await Coupon.create({ code, type, event, expiryDate, assignedTo: assignedTo || null });

        // Broadcast creation to admins or assigned user
        req.app.get("io").emit("new_coupon", coupon);
        res.status(201).json(coupon);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/coupons/:id/use (Mark as used)
router.put("/:id/use", protect, async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) return res.status(404).json({ message: "Not found" });

        // allow security/admin to scan and mark used
        if (!["admin", "head", "security", "guide"].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        coupon.isUsed = true;
        await coupon.save();

        req.app.get("io").emit("coupon_used", coupon);
        res.json(coupon);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
