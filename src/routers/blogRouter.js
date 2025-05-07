const express = require('express');
const blogRouter = express.Router();
const User = require('../models/user');
const { userAuth } = require('../middlewares/auth');
const validateBlog = require('../validators/validateBlog');
const Blog = require('../models/blog');
const Comment = require('../models/comments');
const generateSummaryAndSave = require('../utils/generateSummary');

blogRouter.post('/api/blog', userAuth, async (req, res) => {
  const { title, banner, des, content, tags, draft = false } = req.body;
  const authorId = req.user._id;
  // Validate required fields
  if (!title) {
    return res.status(400).json({ message: 'title is required' });
  }

  try {
    // blog validation
    if (validateBlog({ title, banner, des, content, tags }, false)) {
      // Create new blog post
      const newBlog = new Blog({
        title,
        banner,
        des,
        content: content || [], // Ensure content is an array
        tags: tags || [], // Ensure tags is an array
        author: req.user.id, // From authMiddleware
        activity: {
          total_likes: 0,
          total_comments: 0,
          total_reads: 0,
          total_parent_comments: 0,
        },
        comments: [], // Initialize empty comments array
        draft,
        author: authorId,
      });

      // Save to MongoDB
      const savedBlog = await newBlog.save();
      generateSummaryAndSave(savedBlog._id, content.join(' '));
      res.status(201).json({
        message: 'Blog created successfully',
        blog: savedBlog,
      });
    }
  } catch (err) {
    console.error('Error creating blog:', err);
    res.status(500).json({ message: 'Server error while creating blog' });
  }
});

blogRouter.patch('/api/editBlog/:blogId', userAuth, async (req, res) => {
  // check if user making edit is the author if yes then allow
  const loggedInUserId = req.user._id;
  const blogId = req.params.blogId;
  try {
    // first search if blog with ID exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      throw new Error('No Blog with ID: ' + blogId);
    }
    let authorId = blog.author;
    if (authorId.toString() !== loggedInUserId.toString()) {
      throw new Error('Not Authorized to Edit Blog');
    }
    const { title, banner, des, content, tags } = req.body;
    if (validateBlog({ title, banner, des, content, tags }, true))
      blog.title = title || blog.title;
    blog.banner = banner || blog.banner;
    blog.des = des || blog.des;
    blog.content = content || blog.content;
    blog.tags = tags || blog.tags;
    await blog.save();
    if (content) {
      generateSummaryAndSave(blog._id, content.join(' '));
    }
    return res.json({
      message: 'Blog Updated Successfully',
      blog,
    });
  } catch (err) {
    return res.status(400).send('ERROR: ' + err.message);
  }
});

blogRouter.get('/api/blogFeed', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    if (page < 1 || limit < 1) {
      return res
        .status(400)
        .json({ message: 'Page and limit must be positive integers' });
    }
    const blogs = await Blog.find({ draft: false })
      .populate('author', 'firstName')
      .sort({ publishedAt: -1 }) // Newest first
      .skip((page - 1) * limit)
      .limit(limit);
    if (!blogs) {
      return res.status(400).json({ message: 'Blogs could not be loaded' });
    }
    res.json({ message: 'Blogs Fetched Successfully', blogs });
  } catch (err) {
    res.status(400).send('Error' + err.message);
  }
});

blogRouter.get('/api/blogFeed/summarized', async (req, res) => {
  try {
    const blogs = await Blog.find({ draft: false }, 'summary title _id').sort({
      publishedAt: -1,
    });

    if (!blogs || blogs.length === 0) {
      return res.status(404).json({ message: 'No summaries found' });
    }

    const summariesOfBlogs = blogs.map((blog) => ({
      id: blog._id,
      title: blog.title,
      summary: blog.summary || 'Summary not available yet',
    }));

    res.json({ summariesOfBlogs, message: 'Success' });
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Error fetching summaries: ' + err.message });
  }
});

blogRouter.get('/api/blogFeed/:blogId', async (req, res) => {
  try {
    const blogId = req.params.blogId;
    const blog = await Blog.findOne({ _id: blogId }).populate(
      'author',
      'firstName'
    );
    if (!blog) {
      return res.status(400).json({ message: 'Blog could not be loaded' });
    }
    res.json({ message: 'Blogs Fetched Successfully', blog });
  } catch (err) {
    res.status(400).send('Error' + err.message);
  }
});

blogRouter.get('/api/blog/user', userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const blogList = await Blog.find({ author: userId });
    res.json({ message: 'fetched users blogs successfully', blogList });
  } catch (err) {
    res.status(400).send('ERROR : ' + err.message);
  }
});

blogRouter.delete('/api/deleteBlog/:blogId', userAuth, async (req, res) => {
  const loggedInUserId = req.user._id;
  const blogId = req.params.blogId;
  try {
    // first search if blog with ID exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      throw new Error('No Blog with ID: ' + blogId);
    }
    let authorId = blog.author;
    if (authorId.toString() !== loggedInUserId.toString()) {
      throw new Error('Not Authorized to delete blog');
    }
    // deletion here
    await Blog.findByIdAndDelete(blogId);
    // now delete all comments associated with the blog
    deleteComments = await Comment.find({ blog_id: blogId });
    deleteComments.map(async (comment) => {
      await Comment.findByIdAndDelete(comment._id);
    });
    return res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (err) {
    return res.status(400).send('ERROR: ' + err.message);
  }
});

module.exports = blogRouter;
