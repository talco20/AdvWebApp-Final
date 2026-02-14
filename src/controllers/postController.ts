import { Response } from 'express';
import Post from '../models/postModel';
import Like from '../models/likeModel';
import User from '../models/userModel';
import { AuthRequest } from '../types';
import { generatePostEmbedding } from '../services/embeddingService';
import fs from 'fs';
import path from 'path';

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           type: string
 *         content:
 *           type: string
 *         imageUrl:
 *           type: string
 *         likesCount:
 *           type: number
 *         commentsCount:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all posts
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 */
export const getAllPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username profileImage');

    const total = await Post.countDocuments();

    // If user is authenticated, check which posts they liked
    let likedPostIds: string[] = [];
    if (req.user?.userId) {
      const likes = await Like.find({ userId: req.user.userId });
      likedPostIds = likes.map((like) => like.postId);
    }

    const postsWithLikeStatus = posts.map((post) => ({
      ...post.toObject(),
      isLiked: likedPostIds.includes(post._id.toString()),
    }));

    res.status(200).json({
      success: true,
      data: postsWithLikeStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching posts',
    });
  }
};

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get post by ID
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 */
export const getPostById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id).populate('userId', 'username profileImage');

    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found' });
      return;
    }

    // Check if user liked this post
    let isLiked = false;
    if (req.user?.userId) {
      const like = await Like.findOne({ postId: id, userId: req.user.userId });
      isLiked = !!like;
    }

    res.status(200).json({
      success: true,
      data: {
        ...post.toObject(),
        isLiked,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching post',
    });
  }
};

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Post created successfully
 */
export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { content } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (!content) {
      res.status(400).json({ success: false, error: 'Content is required' });
      return;
    }

    let imageUrl: string | undefined;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // Get user info for better embedding
    const user = await User.findById(userId);
    const username = user?.username;

    // Generate embedding for the post content
    let embedding: number[] | undefined;
    try {
      embedding = await generatePostEmbedding(content, username);
      console.log('Generated embedding for new post');
    } catch (embError: any) {
      console.error('Failed to generate embedding:', embError.message);
      // Continue without embedding - don't fail the entire request
    }

    const post = new Post({
      userId,
      content,
      imageUrl,
      embedding,
    });

    await post.save();
    await post.populate('userId', 'username profileImage');

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error creating post',
    });
  }
};

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Update a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Post updated successfully
 */
export const updatePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { content } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const post = await Post.findById(id);
    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found' });
      return;
    }

    // Check ownership
    if (post.userId.toString() !== userId) {
      res.status(403).json({ success: false, error: 'Not authorized to update this post' });
      return;
    }

    // Update content and regenerate embedding if content changed
    if (content && content !== post.content) {
      post.content = content;
      
      // Regenerate embedding for updated content
      try {
        const user = await User.findById(userId);
        const username = user?.username;
        post.embedding = await generatePostEmbedding(content, username);
        console.log('Regenerated embedding for updated post');
      } catch (embError: any) {
        console.error('Failed to regenerate embedding:', embError.message);
        // Continue without updating embedding
      }
    }

    // Update image if provided
    if (req.file) {
      // Delete old image if exists
      if (post.imageUrl) {
        const oldImagePath = path.join(process.cwd(), post.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      post.imageUrl = `/uploads/${req.file.filename}`;
    }

    await post.save();
    await post.populate('userId', 'username profileImage');

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error updating post',
    });
  }
};

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted successfully
 */
export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const post = await Post.findById(id);
    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found' });
      return;
    }

    // Check ownership
    if (post.userId.toString() !== userId) {
      res.status(403).json({ success: false, error: 'Not authorized to delete this post' });
      return;
    }

    // Delete image if exists
    if (post.imageUrl) {
      const imagePath = path.join(process.cwd(), post.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Post.findByIdAndDelete(id);

    // Delete associated likes and comments
    await Like.deleteMany({ postId: id });

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error deleting post',
    });
  }
};

/**
 * @swagger
 * /posts/{id}/like:
 *   post:
 *     summary: Like or unlike a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post liked/unliked successfully
 */
export const toggleLike = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const post = await Post.findById(id);
    if (!post) {
      res.status(404).json({ success: false, error: 'Post not found' });
      return;
    }

    // Check if already liked
    const existingLike = await Like.findOne({ postId: id, userId });

    if (existingLike) {
      // Unlike
      await Like.findByIdAndDelete(existingLike._id);
      post.likesCount = Math.max(0, post.likesCount - 1);
      await post.save();

      res.status(200).json({
        success: true,
        data: {
          liked: false,
          likesCount: post.likesCount,
        },
      });
    } else {
      // Like
      const like = new Like({ postId: id, userId });
      await like.save();
      post.likesCount += 1;
      await post.save();

      res.status(200).json({
        success: true,
        data: {
          liked: true,
          likesCount: post.likesCount,
        },
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error toggling like',
    });
  }
};

/**
 * @swagger
 * /posts/{id}/likes:
 *   get:
 *     summary: Get users who liked a post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Likes retrieved successfully
 */
export const getPostLikes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const likes = await Like.find({ postId: id }).populate('userId', 'username profileImage');

    res.status(200).json({
      success: true,
      data: likes,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error fetching likes',
    });
  }
};

