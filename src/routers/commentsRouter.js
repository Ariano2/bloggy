const express = require('express');
const commentsRouter = express.Router();
const { userAuth } = require('../middlewares/auth');
const Blog = require('../models/blog');
const Comment = require('../models/comments');
const validateComment = require('../validators/validateComment');

commentsRouter.post('/api/comment/add/:blogId', userAuth, async (req, res) => {
  const userId = req.user._id;
  const blog_id = req.params.blogId;
  let { comment } = req.body;
  comment = comment.trim();
  try {
    if (validateComment(comment)) {
      const blog = await Blog.findById(blog_id);
      if (!blog) {
        throw new Error('No blog with ID = ' + blog_id);
      }
      // use the comment model here to create a new comment
      const blog_author = blog.author;
      const savedComment = new Comment({
        comment,
        blog_id,
        commented_by: userId,
        blog_author,
        isReply: false,
      });
      await savedComment.populate('commented_by', 'firstName');
      await savedComment.save();
      res.json({ message: 'Comment added successfully ', savedComment });
    }
  } catch (err) {
    res.status(400).send('ERROR: ' + err.message);
  }
});

commentsRouter.post(
  '/api/comment/reply/:commentId',
  userAuth,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const parentComment = await Comment.findById(req.params.commentId);
      if (!parentComment) {
        throw new Error('Invalid parent comment');
      }
      const blog_id = parentComment.blog_id;
      const blog_author = parentComment.blog_author;
      const { comment } = req.body;
      const isReply = true;
      const parent = parentComment._id;
      if (validateComment(comment)) {
        const childComment = new Comment({
          blog_id,
          blog_author,
          isReply,
          parent,
          comment,
          commented_by: userId,
        });
        await childComment.save();
        child_id = childComment._id;
        parentComment.children.push(child_id);
        await parentComment.save();
        res.json({
          parentComment,
          childComment,
          message: 'reply created successfully',
        });
      }
    } catch (err) {
      res.status(400).send('ERROR : ' + err.message);
    }
  }
);

commentsRouter.get('/api/comment/fetch/:blogId', async (req, res) => {
  try {
    const { blogId } = req.params;
    const blog = await Blog.findById(blogId);
    if (!blog) {
      throw new Error('Invalid Blog Id');
    }
    const comments = await Comment.find({ blog_id: blogId }).populate([
      {
        path: 'commented_by',
        select: 'firstName',
      },
    ]);
    res.json({ message: 'Comments Fetched successfully', comments });
  } catch (err) {
    res.status(400).send('ERROR : ' + err.message);
  }
});

module.exports = commentsRouter;
