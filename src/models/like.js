const mongoose = require('mongoose');
const { Schema } = mongoose;
const express = require('express');
const router = express.Router();

// Like Schema
const likeSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  blog: {
    type: Schema.Types.ObjectId,
    ref: 'Blog',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a user can only like a blog once
likeSchema.index({ user: 1, blog: 1 }, { unique: true });

const Like = mongoose.model('Like', likeSchema);
module.exports = Like;
