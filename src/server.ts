import app from './app';
import { connectDB } from './utils/db';
import { config } from './config';
import express from 'express';
import https from 'https';
import http from 'http';
import fs from 'fs';

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDB();

    if (config.nodeEnv === 'production') {
      // HTTPS server for production with self-signed certificate
      const options = {
        key: fs.readFileSync('./client-key.pem'),
        cert: fs.readFileSync('./client-cert.pem')
      };
      
      // HTTPS server
      https.createServer(options, app).listen(config.httpsPort, () => {
        console.log('');
        console.log('Server started successfully!');
        console.log(`HTTPS Server running on port ${config.httpsPort}`);
        console.log(`Environment: ${config.nodeEnv}`);
        console.log(`Application: https://node56.cs.colman.ac.il`);
        console.log('');
      });
      
      // HTTP server (redirect to HTTPS)
      const httpApp = express();
      httpApp.use((req, res) => {
        res.redirect(301, `https://${req.headers.host}${req.url}`);
      });
      httpApp.listen(config.httpPort, () => {
        console.log(`HTTP redirect server running on port ${config.httpPort}`);
      });
    } else {
      // HTTP server for development
      http.createServer(app).listen(config.port, () => {
        console.log('');
        console.log('Server started successfully!');
        console.log(`HTTP Server running on port ${config.port}`);
        console.log(`Environment: ${config.nodeEnv}`);
        console.log(`API Documentation: http://localhost:${config.port}/api-docs`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing server');
  process.exit(0);
});

// Start the server
startServer();

export default app;

