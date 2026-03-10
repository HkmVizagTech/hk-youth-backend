import express from "express";
import Circle from "../models/Circle.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/community/circles
router.get("/circles", protect, async (req, res) => {
  try {
    const circles = await Circle.find().populate("leader", "name spiritualName").populate("members", "_id");
    res.json(circles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/community/circles/:id/join — Toggle join
router.post("/circles/:id/join", protect, async (req, res) => {
  try {
    const circle = await Circle.findById(req.params.id);
    const isMember = circle.members.includes(req.user.id);
    if (isMember) circle.members.pull(req.user.id);
    else circle.members.push(req.user.id);
    await circle.save();
    res.json({ joined: !isMember, memberCount: circle.members.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/community/devotees
router.get("/devotees", protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select("name spiritualName username role avatarSeed followers batch center")
      .limit(30);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/community/follow/:id
router.post("/follow/:id", protect, async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    const me = await User.findById(req.user.id);
    const alreadyFollowing = me.following.includes(target._id);
    if (alreadyFollowing) {
      me.following.pull(target._id);
      target.followers.pull(me._id);
    } else {
      me.following.push(target._id);
      target.followers.push(me._id);
    }
    await me.save();
    await target.save();
    res.json({ following: !alreadyFollowing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
