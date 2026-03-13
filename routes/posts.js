import express from "express";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// GET /api/posts — Feed (newest first)
router.get("/", protect, async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('userId', 'displayName spiritualName')
      .lean();

    // Transform userId to user to match frontend expectation
    const formattedPosts = await Promise.all(posts.map(async post => {
      const comments = await Comment.find({ postId: post._id })
        .populate('userId', 'displayName')
        .lean();

      return {
        ...post,
        id: post._id,
        user: { ...post.userId, id: post.userId._id },
        comments: comments.map(c => ({
          ...c,
          id: c._id,
          user: { ...c.userId, id: c.userId._id }
        }))
      };
    }));

    res.json(formattedPosts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts — Create new post (Realization)
router.post("/", protect, async (req, res) => {
  try {
    const { content, imageUrl, type } = req.body;
    const post = await Post.create({
      userId: req.user.id,
      content,
      type: type || 'realization',
      media: imageUrl ? [{ urls: [imageUrl], type: 'image' }] : []
    });

    const populatedPost = await Post.findById(post._id)
      .populate('userId', 'displayName spiritualName')
      .lean();

    const formattedPost = {
      ...populatedPost,
      id: populatedPost._id,
      user: { ...populatedPost.userId, id: populatedPost.userId._id }
    };

    // Emit via the io instance attached to app
    req.app.get("io").emit("new_post", formattedPost);
    res.status(201).json(formattedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/posts/:id/pranam — Toggle pranam (like)
router.post("/:id/pranam", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const alreadyLiked = post.likes.includes(req.user.id);
    if (alreadyLiked) {
      post.likes = post.likes.filter(id => id !== req.user.id);
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

// Legacy support for /like
router.post("/:id/like", protect, async (req, res) => {
  res.redirect(307, `/api/posts/${req.params.id}/pranam`);
});

// POST /api/posts/:id/comment — Add comment
router.post("/:id/comment", protect, async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await Comment.create({
      postId: req.params.id,
      userId: req.user.id,
      content
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('userId', 'displayName')
      .lean();

    const formattedComment = {
      ...populatedComment,
      id: populatedComment._id,
      user: { ...populatedComment.userId, id: populatedComment.userId._id }
    };

    req.app.get("io").emit("new_comment", { postId: req.params.id, comment: formattedComment });
    res.status(201).json(formattedComment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
