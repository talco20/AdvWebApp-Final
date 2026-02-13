import express from 'express';
import {
  getPostComments,
  createComment,
  updateComment,
  deleteComment,
} from '../controllers/commentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/post/:postId', getPostComments);
router.post('/', authenticateToken, createComment);
router.put('/:id', authenticateToken, updateComment);
router.delete('/:id', authenticateToken, deleteComment);

export default router;


