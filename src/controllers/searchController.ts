import { Response } from 'express';
import { AuthRequest } from '../types';
import { searchNews } from '../services/aiService';
import { generateEmbedding, cosineSimilarity } from '../services/embeddingService';
import SearchHistory from '../models/searchHistoryModel';
import Post from '../models/postModel';
import User from '../models/userModel';

/**
 * @swagger
 * /search/news:
 *   post:
 *     summary: AI-powered news search
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
export const searchNewsController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { query } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Search query is required' });
      return;
    }

    // Perform AI search
    const results = await searchNews(query.trim());

    // Save search history
    const searchHistory = new SearchHistory({
      userId,
      query: query.trim(),
      results,
    });
    await searchHistory.save();

    res.status(200).json({
      success: true,
      data: {
        query: query.trim(),
        results,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error searching news',
    });
  }
};

/**
 * @swagger
 * /search/posts:
 *   post:
 *     summary: Semantic search for posts using embeddings
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search query
 *               limit:
 *                 type: number
 *                 description: Maximum number of results (default 10)
 *               threshold:
 *                 type: number
 *                 description: Minimum similarity threshold 0-1 (default 0.7)
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
export const searchPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { query, limit = 10, threshold = 0.7 } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Search query is required' });
      return;
    }

    const queryEmbedding = await generateEmbedding(query.trim());

    const posts = await Post.find({ embedding: { $exists: true, $ne: null } })
      .populate('userId', 'username profileImage')
      .limit(100);

    const results = posts
      .map(post => {
        if (!post.embedding || post.embedding.length === 0) {
          return null;
        }
        
        const similarity = cosineSimilarity(queryEmbedding, post.embedding);
        return {
          post: post.toObject(),
          similarity,
        };
      })
      .filter(result => result !== null && result.similarity >= threshold)
      .sort((a, b) => b!.similarity - a!.similarity)
      .slice(0, limit)
      .map(result => ({
        ...result!.post,
        similarity: result!.similarity,
      }));

    const searchHistory = new SearchHistory({
      userId,
      query: query.trim(),
      results: results.map(r => ({ postId: r._id, similarity: r.similarity })),
    });
    await searchHistory.save();

    res.status(200).json({
      success: true,
      data: {
        query: query.trim(),
        count: results.length,
        results,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error searching posts',
    });
  }
};

/**
 * @swagger
 * /search/users:
 *   post:
 *     summary: Semantic search for users using embeddings
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search query
 *               limit:
 *                 type: number
 *                 description: Maximum number of results (default 10)
 *               threshold:
 *                 type: number
 *                 description: Minimum similarity threshold 0-1 (default 0.7)
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 */
export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { query, limit = 10, threshold = 0.7 } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Search query is required' });
      return;
    }

    const queryEmbedding = await generateEmbedding(query.trim());

    const users = await User.find({ embedding: { $exists: true, $ne: null } })
      .limit(100);

    const results = users
      .map(user => {
        if (!user.embedding || user.embedding.length === 0) {
          return null;
        }
        
        const similarity = cosineSimilarity(queryEmbedding, user.embedding);
        return {
          user: user.toObject(),
          similarity,
        };
      })
      .filter(result => result !== null && result.similarity >= threshold)
      .sort((a, b) => b!.similarity - a!.similarity)
      .slice(0, limit)
      .map(result => ({
        ...result!.user,
        similarity: result!.similarity,
      }));

    res.status(200).json({
      success: true,
      data: {
        query: query.trim(),
        count: results.length,
        results,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error searching users',
    });
  }
};


