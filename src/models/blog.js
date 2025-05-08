const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const blogSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    banner: {
      type: String,
    },
    des: {
      type: String,
      maxlength: 200,
    },
    content: {
      type: [],
    },
    summary: { type: String, default: '' },
    tags: {
      type: [String],
    },
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    activity: {
      total_likes: {
        type: Number,
        default: 0,
      },
      total_comments: {
        type: Number,
        default: 0,
      },
      total_reads: {
        type: Number,
        default: 0,
      },
      total_parent_comments: {
        type: Number,
        default: 0,
      },
    },
    comments: {
      type: [Schema.Types.ObjectId],
      ref: 'comments',
    },
    draft: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: {
      createdAt: 'publishedAt',
    },
  }
);

blogSchema.methods.incrementLikes = async function () {
  this.activity.total_likes = this.activity.total_likes + 1;
  await this.save();
};

blogSchema.methods.decrementLikes = async function () {
  this.activity.total_likes = this.activity.total_likes - 1;
  await this.save();
};

blogSchema.methods.incrementRead = function () {
  this.activity.total_reads += 1;
};

blogSchema.methods.incrementComments = function () {
  this.activity.total_comments += 1;
};

Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;
