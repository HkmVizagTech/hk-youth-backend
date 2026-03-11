import express from "express";
import { prisma } from "../lib/providers.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/coupons (Admin: all, Member: their own)
router.get("/", protect, async (req, res) => {
    try {
        let where = {};
        if (['folk_member', 'youth'].includes(req.user.role)) {
            where.assignedTo = req.user.id;
        }
        const coupons = await prisma.coupon.findMany({
            where,
            orderBy: { createdAt: "desc" }
        });
        res.json(coupons);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/coupons (Admin/Guide only)
router.post("/", protect, requireRole("admin", "guide", "folk_admin", "folk_guide"), async (req, res) => {
    try {
        const { code, type, event, expiryDate, assignedTo } = req.body;
        const coupon = await prisma.coupon.create({
            data: {
                code,
                type,
                event,
                expiryDate: new Date(expiryDate),
                assignedTo: assignedTo || null
            }
        });

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
        const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id } });
        if (!coupon) return res.status(404).json({ message: "Not found" });

        // allow security/admin/guide to scan and mark used
        if (!["admin", "head", "security", "guide", "folk_admin", "folk_guide"].includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const updated = await prisma.coupon.update({
            where: { id: req.params.id },
            data: { isUsed: true }
        });

        req.app.get("io").emit("coupon_used", updated);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
