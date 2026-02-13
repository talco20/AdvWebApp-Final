import express from 'express';
import {
  register,
  login,
  refresh,
  logout,
  googleAuth,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

router.post('/register', upload.single('profileImage'), register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', authenticateToken, logout);

// Google OAuth - client-side Sign-In (no server redirect needed)
router.post('/google', googleAuth);

export default router;

