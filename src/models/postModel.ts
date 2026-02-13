import mongoose, { Schema } from 'mongoose';
import { IPost } from '../types';

const postSchema = new Schema<IPost>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    embedding: {
      type: [Number],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
postSchema.index({ createdAt: -1 });
postSchema.index({ userId: 1, createdAt: -1 });

const Post = mongoose.model<IPost>('Post', postSchema);

export default Post;


