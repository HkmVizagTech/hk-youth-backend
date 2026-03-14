import express from "express";
import User from "../models/User.js";

const router = express.Router();

const DEFAULT_ADMIN_ID = "69b3b15231109afc1b41d619";

// POST /api/auth/otp/start
router.post("/otp/start", async (req, res) => {
  res.json({ sent: true, maskedIdentifier: "****", expiresIn: 300 });
});

// POST /api/auth/otp/verify
router.post("/otp/verify", async (req, res) => {
  try {
    const user = await User.findById(DEFAULT_ADMIN_ID);
    res.json({ token: "bypass-token", user, isNewUser: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login (Mail Login)
router.post("/login", async (req, res) => {
  try {
    const user = await User.findById(DEFAULT_ADMIN_ID);
    res.json({ token: "bypass-token", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/me
router.get("/me", async (req, res) => {
  try {
    const user = await User.findById(DEFAULT_ADMIN_ID);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

