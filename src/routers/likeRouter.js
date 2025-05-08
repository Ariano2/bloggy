const express = require('express');
const likesRouter = express.Router();
const { userAuth } = require('../middlewares/auth');
const Blog = require('../models/blog');
const Like = require('../models/like');

likesRouter.post('/api/like/:blogId', userAuth, async (req, res) => {
  try {
    const { blogId } = req.params;
    const userId = req.user._id;

    // Verify blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    // Check if user already liked the blog
    const existingLike = await Like.findOne({ user: userId, blog: blogId });
    if (existingLike) {
      throw new Error('Already Liked Blog');
    }

    // Create new like
    const like = new Like({ user: userId, blog: blogId });
    await like.save();

    // Update blog's total_likes
    await blog.incrementLikes();
    console.log(blog.activity);

    return res.json({
      message: 'Blog liked successfully',
      total_likes: blog.activity.total_likes,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Unlike a Blog
likesRouter.delete('/api/unlike/:blogId', userAuth, async (req, res) => {
  try {
    const { blogId } = req.params;
    const userId = req.user._id;

    // Verify blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Check if like exists
    const like = await Like.findOneAndDelete({ user: userId, blog: blogId });
    if (!like) {
      return res.status(400).json({ error: 'You have not liked this blog' });
    }

    // Update blog's total_likes
    await blog.decrementLikes();

    res.status(200).json({
      message: 'Blog unliked successfully',
      total_likes: blog.activity.total_likes,
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Likes Information
likesRouter.get('/api/likes/:blogId', async (req, res) => {
  try {
    const { blogId } = req.params;
    const userId = req.user._id;

    // Verify blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Check if user liked the blog
    const userLiked = await Like.findOne({ user: userId, blog: blogId });
    if (userLiked) {
      return res.status(200).json({
        total_likes: userLiked.total_likes,
        user_liked: true,
      });
    } else {
      return res.status(200).json({
        total_likes: userLiked.total_likes,
        user_liked: false,
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = likesRouter;
