import { Response } from 'express';
import { AuthRequest } from '../types';
import { searchNews, analyzeContent, generateContentSuggestions } from '../services/aiService';
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
 * /search/history:
 *   get:
 *     summary: Get user's search history
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
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
 *         description: Search history retrieved successfully
 */
export const getSearchHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const history = await SearchHistory.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SearchHistory.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: history,
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
      error: error.message || 'Error fetching search history',
    });
  }
};

/**
 * @swagger
 * /search/analyze:
 *   post:
 *     summary: Analyze content using AI
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content analyzed successfully
 */
export const analyzeContentController = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const analysis = await analyzeContent(content);

    res.status(200).json({
      success: true,
      data: { analysis },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error analyzing content',
    });
  }
};

/**
 * @swagger
 * /search/suggestions:
 *   post:
 *     summary: Get content suggestions for a topic
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
 *               - topic
 *             properties:
 *               topic:
 *                 type: string
 *     responses:
 *       200:
 *         description: Suggestions generated successfully
 */
export const getSuggestionsController = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { topic } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    if (!topic) {
      res.status(400).json({ success: false, error: 'Topic is required' });
      return;
    }

    const suggestions = await generateContentSuggestions(topic);

    res.status(200).json({
      success: true,
      data: { suggestions },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error generating suggestions',
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

    console.log(`🔍 Semantic search for posts: "${query}"`);

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query.trim());
    console.log(`✅ Generated query embedding with ${queryEmbedding.length} dimensions`);

    // Get all posts with embeddings (in production, use vector search index)
    // Note: For MongoDB Atlas, you would use $vectorSearch aggregation
    const posts = await Post.find({ embedding: { $exists: true, $ne: null } })
      .populate('userId', 'username profileImage')
      .limit(100); // Get a reasonable batch for similarity calculation

    console.log(`📊 Found ${posts.length} posts with embeddings`);

    // Calculate similarity scores for each post
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

    console.log(`✅ Found ${results.length} similar posts above threshold ${threshold}`);

    // Save search history
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
    console.error('Semantic search error:', error);
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

    console.log(`🔍 Semantic search for users: "${query}"`);

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query.trim());
    console.log(`✅ Generated query embedding with ${queryEmbedding.length} dimensions`);

    // Get all users with embeddings (in production, use vector search index)
    const users = await User.find({ embedding: { $exists: true, $ne: null } })
      .limit(100); // Get a reasonable batch

    console.log(`📊 Found ${users.length} users with embeddings`);

    // Calculate similarity scores
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

    console.log(`✅ Found ${results.length} similar users above threshold ${threshold}`);

    res.status(200).json({
      success: true,
      data: {
        query: query.trim(),
        count: results.length,
        results,
      },
    });
  } catch (error: any) {
    console.error('Semantic search error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error searching users',
    });
  }
};


