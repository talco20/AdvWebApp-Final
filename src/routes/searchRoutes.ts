import express from 'express';
import {
  searchNewsController,
  getSearchHistory,
  analyzeContentController,
  getSuggestionsController,
  searchPosts,
  searchUsers,
} from '../controllers/searchController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// AI-powered news search
router.post('/news', authenticateToken, searchNewsController);

// Semantic search using embeddings
router.post('/posts', authenticateToken, searchPosts);
router.post('/users', authenticateToken, searchUsers);

// Other search features
router.get('/history', authenticateToken, getSearchHistory);
router.post('/analyze', authenticateToken, analyzeContentController);
router.post('/suggestions', authenticateToken, getSuggestionsController);

export default router;


