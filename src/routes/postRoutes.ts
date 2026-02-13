import express from 'express';
import {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  getPostLikes,
} from '../controllers/postController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

router.get('/', optionalAuth, getAllPosts);
router.get('/:id', optionalAuth, getPostById);
router.post('/', authenticateToken, upload.single('image'), createPost);
router.put('/:id', authenticateToken, upload.single('image'), updatePost);
router.delete('/:id', authenticateToken, deletePost);
router.post('/:id/like', authenticateToken, toggleLike);
router.get('/:id/likes', getPostLikes);

export default router;


