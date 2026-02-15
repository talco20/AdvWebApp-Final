import express from 'express';
import {
  searchNewsController,
  searchPosts,
  searchUsers,
} from '../controllers/searchController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/news', authenticateToken, searchNewsController);
router.post('/posts', authenticateToken, searchPosts);
router.post('/users', authenticateToken, searchUsers);

export default router;


