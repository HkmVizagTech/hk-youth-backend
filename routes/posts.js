import express from "express";
import { prisma } from "../lib/providers.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/posts — Feed (newest first)
router.get("/", protect, async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            spiritualName: true,
            // phone is omitted for privacy in feed
          }
        },
        comments: {
          include: {
            user: {
              select: { id: true, displayName: true }
            }
          }
        }
      }
    });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts — Create new post (Realization)
router.post("/", protect, async (req, res) => {
  try {
    const { content, tag, imageUrl, type } = req.body;
    const post = await prisma.post.create({
      data: {
        userId: req.user.id,
        content,
        type: type || 'realization',
        media: imageUrl ? { urls: [imageUrl], type: 'image' } : null
      },
      include: {
        user: {
          select: { id: true, displayName: true, spiritualName: true }
        }
      }
    });

    // Emit via the io instance attached to app
    req.app.get("io").emit("new_post", post);
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts/:id/pranam — Toggle pranam (like)
router.post("/:id/pranam", protect, async (req, res) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ message: "Post not found" });

    const alreadyLiked = post.likes.includes(req.user.id);
    let newLikes;
    if (alreadyLiked) {
      newLikes = post.likes.filter(id => id !== req.user.id);
    } else {
      newLikes = [...post.likes, req.user.id];
    }

    const updated = await prisma.post.update({
      where: { id: req.params.id },
      data: { likes: newLikes }
    });

    req.app.get("io").emit("post_liked", { postId: updated.id, likes: updated.likes });
    res.json({ likes: updated.likes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Legacy support for /like
router.post("/:id/like", protect, async (req, res) => {
  res.redirect(307, `/api/posts/${req.params.id}/pranam`);
});

// POST /api/posts/:id/comment — Add comment
router.post("/:id/comment", protect, async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await prisma.comment.create({
      data: {
        postId: req.params.id,
        userId: req.user.id,
        content
      },
      include: {
        user: { select: { id: true, displayName: true } }
      }
    });

    req.app.get("io").emit("new_comment", { postId: req.params.id, comment });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
