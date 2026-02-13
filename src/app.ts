import express, { Express } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import passport from './config/passport';
import { setupSwagger } from './config/swagger';
import { config } from './config';

// Routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import postRoutes from './routes/postRoutes';
import commentRoutes from './routes/commentRoutes';
import searchRoutes from './routes/searchRoutes';

const app: Express = express();

// CORS configuration
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

// Body parser middleware
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(process.cwd(), config.uploadDir)));

// Serve React frontend in production
if (config.nodeEnv === 'production') {
  const frontendBuildPath = path.join(process.cwd(), 'frontend', 'build');
  app.use(express.static(frontendBuildPath));
}

// Root route (only for development or if React files not found)
app.get('/', (req, res) => {
  if (config.nodeEnv === 'production') {
    res.sendFile(path.join(process.cwd(), 'frontend', 'build', 'index.html'));
  } else {
    res.json({
      message: 'News Search Application API',
      version: '1.0.0',
      docs: '/api-docs',
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/posts', postRoutes);
app.use('/comments', commentRoutes);
app.use('/search', searchRoutes);

// Setup Swagger documentation
setupSwagger(app);

// 404 handler - serve React for client-side routing in production
app.use((req, res) => {
  if (config.nodeEnv === 'production' && !req.path.startsWith('/auth') && !req.path.startsWith('/users') && !req.path.startsWith('/posts') && !req.path.startsWith('/comments') && !req.path.startsWith('/search') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.join(process.cwd(), 'frontend', 'build', 'index.html'));
  } else {
    res.status(404).json({
      success: false,
      error: 'Route not found',
    });
  }
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

export default app;

