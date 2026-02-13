import { Request } from 'express';
import { Document, Types } from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password?: string;
  googleId?: string;
  profileImage?: string;
  refreshTokens: string[];
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Post Types
export interface IPost extends Document {
  _id: Types.ObjectId;
  userId: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

// Comment Types
export interface IComment extends Document {
  _id: Types.ObjectId;
  postId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Like Types
export interface ILike extends Document {
  _id: Types.ObjectId;
  postId: string;
  userId: string;
  createdAt: Date;
}

// Chat Message Types
export interface IChatMessage extends Document {
  _id: Types.ObjectId;
  senderId: string;
  receiverId: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

// Search History Types
export interface ISearchHistory extends Document {
  _id: Types.ObjectId;
  userId: string;
  query: string;
  results: any;
  createdAt: Date;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  email: string;
}

// Type alias for authenticated requests
export type AuthRequest = Request;

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Pagination Types
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

