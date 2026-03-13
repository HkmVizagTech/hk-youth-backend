import express from "express";
import Circle from "../models/Circle.js";
import User from "../models/User.js";
import SadhanaLog from "../models/SadhanaLog.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/community/circles
router.get("/circles", protect, async (req, res) => {
  try {
    const circles = await Circle.find()
      .populate('leaderId', 'displayName spiritualName')
      .lean();

    const formatted = circles.map(c => ({
      ...c,
      id: c._id,
      leader: c.leaderId ? { ...c.leaderId, id: c.leaderId._id } : null,
      memberCount: c.memberIds?.length || 0
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/community/circles/:id/join — Toggle join
router.post("/circles/:id/join", protect, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    if (!circle) return res.status(404).json({ message: "Circle not found" });

    const isMember = circle.memberIds.includes(req.user.id);

    if (isMember) {
      circle.memberIds = circle.memberIds.filter(id => id.toString() !== req.user.id);
    } else {
      circle.memberIds.push(req.user.id);
    }

    await circle.save();
    res.json({ joined: !isMember, memberCount: circle.memberIds.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/community/devotees
router.get("/devotees", protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const users = await User.find({ _id: { $ne: req.user.id } })
      .populate('centerId', 'name')
      .populate('batchId', 'name')
      .limit(30)
      .lean();

    const mappedUsers = await Promise.all(users.map(async u => {
      const sadhana = await SadhanaLog.findOne({
        userId: u._id,
        date: { $gte: today }
      }).lean();

      return {
        ...u,
        id: u._id,
        center: u.centerId ? { name: u.centerId.name } : null,
        batch: u.batchId ? { name: u.batchId.name } : null,
        followerCount: u.followerIds?.length || 0,
        todayJapa: sadhana ? sadhana.japaRounds : 0
      };
    }));

    res.json(mappedUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/community/shelter/:id
router.post("/shelter/:id", protect, async (req, res) => {
  try {
    const me = await User.findById(req.user.id);
    const target = await User.findById(req.params.id);

    if (!target) return res.status(404).json({ message: "User not found" });

    const alreadyFollowing = me.followingIds.includes(req.params.id);

    if (alreadyFollowing) {
      me.followingIds = me.followingIds.filter(id => id.toString() !== req.params.id);
      target.followerIds = target.followerIds.filter(id => id.toString() !== req.user.id);
    } else {
      me.followingIds.push(req.params.id);
      target.followerIds.push(req.user.id);
    }

    await Promise.all([me.save(), target.save()]);

    res.json({ sheltered: !alreadyFollowing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Legacy support for /follow
router.post("/follow/:id", protect, async (req, res) => {
  res.redirect(307, `/api/community/shelter/${req.params.id}`);
});

export default router;
