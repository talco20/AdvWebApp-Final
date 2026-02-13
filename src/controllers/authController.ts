import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';
import { config } from '../config';
import { AuthRequest, JWTPayload } from '../types';
import { generateUserEmbedding } from '../services/embeddingService';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(config.googleClientId);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         profileImage:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             accessToken:
 *               type: string
 *             refreshToken:
 *               type: string
 *             user:
 *               $ref: '#/components/schemas/User'
 */

// Generate access token
const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
};

// Generate refresh token
const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn,
  } as jwt.SignOptions);
};

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    let { username, email, password } = req.body;

    // Trim whitespace
    username = username?.trim();
    email = email?.trim().toLowerCase();

    // Validation
    if (!username || !email || !password) {
      res.status(400).json({
        success: false,
        error: 'Username, email, and password are required',
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
      return;
    }

    // Validate password length
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long',
      });
      return;
    }

    // Validate username length
    if (username.length < 3 || username.length > 50) {
      res.status(400).json({
        success: false,
        error: 'Username must be between 3 and 50 characters',
      });
      return;
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'User with this email or username already exists',
      });
      return;
    }

    // Handle profile image upload
    let profileImage: string | undefined;
    if (req.file) {
      profileImage = `/uploads/${req.file.filename}`;
      console.log('✅ Profile image uploaded:', profileImage);
    }

    // Generate embedding for the user
    let embedding: number[] | undefined;
    try {
      embedding = await generateUserEmbedding(username, email);
      console.log('✅ Generated embedding for new user');
    } catch (embError: any) {
      console.error('⚠️ Failed to generate embedding:', embError.message);
      // Continue without embedding - don't fail the entire registration
    }

    // Create user
    const user = new User({ username, email, password, profileImage, embedding });
    await user.save();

    // Generate tokens
    const payload: JWTPayload = { userId: user._id.toString(), email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save refresh token
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error registering user',
    });
  }
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with credentials
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    let { email, password } = req.body;

    // Trim and normalize email
    email = email?.trim().toLowerCase();

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
      return;
    }

    // Find user (case-insensitive email)
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
      return;
    }

    // Generate tokens
    const payload: JWTPayload = { userId: user._id.toString(), email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save refresh token
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error logging in',
    });
  }
};

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Refresh token required',
      });
      return;
    }

    // Verify refresh token
    jwt.verify(refreshToken, config.jwtRefreshSecret as string, async (err: any, decoded: any) => {
      if (err) {
        res.status(403).json({
          success: false,
          error: 'Invalid or expired refresh token',
        });
        return;
      }

      const payload = decoded as JWTPayload;

      // Check if refresh token exists in database
      const user = await User.findById(payload.userId);
      if (!user || !user.refreshTokens.includes(refreshToken)) {
        res.status(403).json({
          success: false,
          error: 'Invalid refresh token',
        });
        return;
      }

      // Generate new access token
      const newAccessToken = generateAccessToken({
        userId: user._id.toString(),
        email: user.email,
      });

      res.status(200).json({
        success: true,
        data: {
          accessToken: newAccessToken,
        },
      });
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error refreshing token',
    });
  }
};

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    // Remove refresh token from database
    const user = await User.findById(userId);
    if (user && refreshToken) {
      user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Error logging out',
    });
  }
};

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Google OAuth login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - googleToken
 *             properties:
 *               googleToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Google login successful
 */
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    // Verify the Google ID token sent from the frontend (client-side Google Sign-In)
    const ticket = await googleClient.verifyIdToken({
      idToken: req.body.credential,
      audience: config.googleClientId,
    });
    
    const payload = ticket.getPayload();
    const email = payload?.email;
    const googleId = payload?.sub;
    const profileImage = payload?.picture;
    const displayName = payload?.name;

    if (!email || !googleId) {
      res.status(400).json({
        success: false,
        error: 'Invalid Google token',
      });
      return;
    }

    // Find or create user
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      // Create new user
      const newUsername = displayName || email.split('@')[0];
      
      // Generate embedding for the new user
      let embedding: number[] | undefined;
      try {
        embedding = await generateUserEmbedding(newUsername, email);
        console.log('✅ Generated embedding for new Google user');
      } catch (embError: any) {
        console.error('⚠️ Failed to generate embedding:', embError.message);
      }
      
      user = new User({
        username: newUsername,
        email,
        googleId,
        profileImage,
        embedding,
      });
      await user.save();
    } else if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId;
      if (profileImage) user.profileImage = profileImage;
      await user.save();
    }

    // Generate tokens
    const jwtPayload: JWTPayload = { userId: user._id.toString(), email: user.email };
    const accessToken = generateAccessToken(jwtPayload);
    const refreshToken = generateRefreshToken(jwtPayload);

    // Save refresh token
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          profileImage: user.profileImage,
        },
      },
    });
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Google authentication failed',
    });
  }
};

