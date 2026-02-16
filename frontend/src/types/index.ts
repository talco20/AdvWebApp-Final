export interface User {
  _id: string;
  username: string;
  email: string;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  _id: string;
  userId: User;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  postId: string;
  userId: User;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  title: string;
  summary: string;
  relevance: string;
  category: string;
  url?: string;
  publishedDate?: string;
  source?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}

