import express from "express";
import jwt from "jsonwebtoken";
import { prisma, LiveOTPProvider } from "../lib/providers.js";

const router = express.Router();

// POST /api/auth/otp/start
router.post("/otp/start", async (req, res) => {
  try {
    const { identifier, type } = req.body; // identifier = phone/email, type = 'phone'/'email'
    if (!identifier) return res.status(400).json({ message: "Identifier is required" });

    const result = await LiveOTPProvider.start(identifier, type || (identifier.includes('@') ? 'email' : 'phone'));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/otp/verify
router.post("/otp/verify", async (req, res) => {
  try {
    const { identifier, otp, name } = req.body;
    const verify = await LiveOTPProvider.verify(identifier, otp);
    if (!verify.valid) return res.status(400).json({ message: "Invalid or expired OTP" });

    // Find or create User
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: identifier },
          { email: identifier }
        ]
      }
    });

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = await prisma.user.create({
        data: {
          displayName: name || identifier,
          phone: identifier.includes('@') ? null : identifier,
          email: identifier.includes('@') ? identifier : null,
          role: 'folk_member'
        }
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.displayName },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: "7d" }
    );

    res.json({ token, user, isNewUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/me
router.get("/me", async (req, res) => {
  // Basic me route (logic to be moved to middleware later)
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    res.json(user);
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
});

export default router;
