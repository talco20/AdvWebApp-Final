import mongoose, { Schema } from 'mongoose';
import { ILike } from '../types';

const likeSchema = new Schema<ILike>(
  {
    postId: {
      type: String,
      required: true,
      ref: 'Post',
      index: true,
    },
    userId: {
      type: String,
      required: true,
      ref: 'User',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate likes
likeSchema.index({ postId: 1, userId: 1 }, { unique: true });

const Like = mongoose.model<ILike>('Like', likeSchema);

export default Like;


