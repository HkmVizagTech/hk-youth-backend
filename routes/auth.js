import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, username, password, spiritualName, role, center, batch } = req.body;
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: "Username already taken" });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, username, password: hash, spiritualName, role, center, batch });
    
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role, name: user.name, spiritualName: user.spiritualName, avatarSeed: user.avatarSeed },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.status(201).json({ token, user: { _id: user._id, name: user.name, username: user.username, role: user.role, spiritualName: user.spiritualName } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role, name: user.name, spiritualName: user.spiritualName, avatarSeed: user.avatarSeed },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, user: { _id: user._id, name: user.name, username: user.username, role: user.role, spiritualName: user.spiritualName } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
