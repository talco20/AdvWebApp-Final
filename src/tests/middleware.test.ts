import request from 'supertest';
import app from '../app';
import jwt from 'jsonwebtoken';
import { config } from '../config';

describe('Middleware Tests', () => {
  describe('Authentication Middleware', () => {
    it('should reject request without token', async () => {
      const res = await request(app).get('/users/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('token');
    });

    it('should reject request with invalid token format', async () => {
      const res = await request(app)
        .get('/users/me')
        .set('Authorization', 'InvalidFormat');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject request with malformed token', async () => {
      const res = await request(app)
        .get('/users/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: '507f1f77bcf86cd799439011', email: 'test@example.com' },
        config.jwtSecret as string,
        { expiresIn: '0s' }
      );

      // Wait a moment to ensure token is expired
      await new Promise(resolve => setTimeout(resolve, 100));

      const res = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should accept valid token', async () => {
      const registerRes = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      const token = registerRes.body.data.accessToken;

      const res = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('CORS Middleware', () => {
    it('should include CORS headers', async () => {
      const res = await request(app).get('/');

      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const res = await request(app).get('/non-existent-route');

      expect(res.status).toBe(404);
    });

    it('should handle invalid JSON in request body', async () => {
      const res = await request(app)
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json{');

      expect(res.status).toBe(400);
    });
  });
});

