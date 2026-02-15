import dotenv from 'dotenv';
import path from 'path';

// Load .env file from project root (using process.cwd() since __dirname doesn't work reliably in compiled TS)
dotenv.config({ path: path.join(process.cwd(), '.env') });

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  httpsPort: parseInt(process.env.HTTPS_PORT || '443', 10),
  httpPort: parseInt(process.env.HTTP_PORT || '80', 10),

  // MongoDB
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/news-search-app',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:4000/auth/google/callback',

  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY || '',

  // File Upload
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};


