import express from "express";
import Post from "../models/Post.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/posts  — Feed (newest first)
router.get("/", protect, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("author", "name spiritualName username avatarSeed")
      .populate("comments.author", "name avatarSeed");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts — Create new post
router.post("/", protect, async (req, res) => {
  try {
    const { content, tag, imageUrl } = req.body;
    const post = await Post.create({ author: req.user.id, content, tag, imageUrl });
    await post.populate("author", "name spiritualName username avatarSeed");
    // Emit via the io instance attached to app
    req.app.get("io").emit("new_post", post);
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts/:id/like — Toggle like
router.post("/:id/like", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const alreadyLiked = post.likes.includes(req.user.id);
    if (alreadyLiked) {
      post.likes.pull(req.user.id);
    } else {
      post.likes.push(req.user.id);
    }
    await post.save();

    req.app.get("io").emit("post_liked", { postId: post._id, likes: post.likes });
    res.json({ likes: post.likes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts/:id/comment — Add comment
router.post("/:id/comment", protect, async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ author: req.user.id, text });
    await post.save();
    await post.populate("comments.author", "name avatarSeed");

    const newComment = post.comments[post.comments.length - 1];
    req.app.get("io").emit("new_comment", { postId: post._id, comment: newComment });
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
