import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthRequest, JWTPayload } from '../types';

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ success: false, error: 'Access token required' });
      return;
    }

    jwt.verify(token, config.jwtSecret, (err, decoded) => {
      if (err) {
        res.status(403).json({ success: false, error: 'Invalid or expired token' });
        return;
      }

      req.user = decoded as JWTPayload;
      next();
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Authentication error' });
  }
};

export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    jwt.verify(token, config.jwtSecret, (err, decoded) => {
      if (!err) {
        req.user = decoded as JWTPayload;
      }
      next();
    });
  } catch (error) {
    next();
  }
};


