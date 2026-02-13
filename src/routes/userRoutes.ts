import express from 'express';
import {
  getCurrentUser,
  getUserById,
  updateCurrentUser,
  uploadProfileImage,
  getUserPosts,
} from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

router.get('/me', authenticateToken, getCurrentUser);
router.get('/:id', getUserById);
router.put('/me', authenticateToken, updateCurrentUser);
router.post('/me/image', authenticateToken, upload.single('image'), uploadProfileImage);
router.get('/:id/posts', getUserPosts);

export default router;


