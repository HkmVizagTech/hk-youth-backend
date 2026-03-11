import express from "express";
import { prisma } from "../lib/providers.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/community/circles
router.get("/circles", protect, async (req, res) => {
  try {
    const circles = await prisma.circle.findMany({
      include: {
        leader: { select: { id: true, displayName: true, spiritualName: true } },
        _count: { select: { members: true } }
      }
    });
    res.json(circles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/community/circles/:id/join — Toggle join
router.post("/circles/:id/join", protect, async (req, res) => {
  try {
    const circle = await prisma.circle.findUnique({
      where: { id: req.params.id },
      include: { members: { select: { id: true } } }
    });

    const isMember = circle.members.some(m => m.id === req.user.id);

    if (isMember) {
      await prisma.circle.update({
        where: { id: req.params.id },
        data: { members: { disconnect: { id: req.user.id } } }
      });
    } else {
      await prisma.circle.update({
        where: { id: req.params.id },
        data: { members: { connect: { id: req.user.id } } }
      });
    }

    const updated = await prisma.circle.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { members: true } } }
    });

    res.json({ joined: !isMember, memberCount: updated._count.members });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/community/devotees
router.get("/devotees", protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany({
      where: { id: { not: req.user.id } },
      select: {
        id: true,
        displayName: true,
        spiritualName: true,
        role: true,
        phone: true,
        center: { select: { name: true } },
        batch: { select: { name: true } },
        _count: { select: { followers: true } },
        sadhanaLogs: {
          where: { date: { gte: today } },
          select: { japaRounds: true },
          take: 1
        }
      },
      take: 30
    });

    const mappedUsers = users.map(u => ({
      ...u,
      todayJapa: u.sadhanaLogs.length > 0 ? u.sadhanaLogs[0].japaRounds : 0
    }));

    res.json(mappedUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/community/shelter/:id
router.post("/shelter/:id", protect, async (req, res) => {
  try {
    const me = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { following: { select: { id: true } } }
    });

    const alreadyFollowing = me.following.some(f => f.id === req.params.id);

    if (alreadyFollowing) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { following: { disconnect: { id: req.params.id } } }
      });
    } else {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { following: { connect: { id: req.params.id } } }
      });
    }

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
