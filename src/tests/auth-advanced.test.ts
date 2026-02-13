import request from 'supertest';
import app from '../app';
import User from '../models/userModel';
import jwt from 'jsonwebtoken';
import { config } from '../config';

describe('Auth API - Advanced Tests', () => {
  describe('POST /auth/register - Edge Cases', () => {
    it('should validate email format', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid email format');
    });

    it('should require minimum password length', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('at least 6 characters');
    });

    it('should trim whitespace from username and email', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          username: '  testuser  ',
          email: '  test@example.com  ',
          password: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.username).toBe('testuser');
      expect(res.body.data.user.email).toBe('test@example.com');
    });

    it('should prevent SQL injection in username', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          username: "'; DROP TABLE users; --",
          email: 'test@example.com',
          password: 'password123',
        });

      // Should succeed - MongoDB is not vulnerable to SQL injection
      // But the username will be stored as-is
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should handle very long username', async () => {
      const longUsername = 'a'.repeat(100);
      const res = await request(app)
        .post('/auth/register')
        .send({
          username: longUsername,
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('between 3 and 50 characters');
    });

    it('should handle unicode in username', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          username: '用户名123',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /auth/login - Edge Cases', () => {
    beforeEach(async () => {
      await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });
    });

    it('should be case-insensitive for email', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'TEST@EXAMPLE.COM',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should handle multiple failed login attempts', async () => {
      // Try multiple failed logins
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword',
          });
      }

      // Should still allow correct login (no rate limiting in basic implementation)
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
    });

    it('should not reveal if email exists', async () => {
      const nonExistentRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      const wrongPasswordRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      // Both should return similar error (security best practice)
      expect(nonExistentRes.status).toBe(wrongPasswordRes.status);
    });
  });

  describe('POST /auth/refresh - Advanced', () => {
    let refreshToken: string;
    let userId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      refreshToken = res.body.data.refreshToken;
      userId = res.body.data.user._id;
    });

    it('should invalidate refresh token after logout', async () => {
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      const accessToken = loginRes.body.data.accessToken;
      const refreshToken = loginRes.body.data.refreshToken;

      // Logout
      await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      // Try to use refresh token after logout
      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should not accept access token as refresh token', async () => {
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      const accessToken = loginRes.body.data.accessToken;

      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: accessToken });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should handle tampered refresh token', async () => {
      const tamperedToken = refreshToken.slice(0, -5) + 'xxxxx';

      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: tamperedToken });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should handle refresh token with wrong signature', async () => {
      const fakeToken = jwt.sign(
        { userId, email: 'test@example.com' },
        'wrong-secret',
        { expiresIn: '7d' }
      );

      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: fakeToken });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /auth/logout - Advanced', () => {
    it('should handle logout with invalid refresh token', async () => {
      const registerRes = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      const accessToken = registerRes.body.data.accessToken;

      const res = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken: 'invalid-token' });

      // Should succeed (idempotent logout) - just won't remove any token
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should handle logout without refresh token', async () => {
      const registerRes = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      const accessToken = registerRes.body.data.accessToken;

      const res = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      // Should succeed (idempotent logout) - just won't remove any token
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should handle multiple logouts with same token', async () => {
      const registerRes = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      const { accessToken, refreshToken } = registerRes.body.data;

      // First logout
      const res1 = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);

      // Second logout with same tokens (already removed)
      const res2 = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      // Should still succeed (idempotent) - token already removed
      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);
    });
  });

  describe('Security Tests', () => {
    it('should hash passwords (not store plain text)', async () => {
      await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      const user = await User.findOne({ email: 'test@example.com' });
      
      expect(user).toBeDefined();
      expect(user?.password).not.toBe('password123');
      if (user?.password) {
        expect(user.password.length).toBeGreaterThan(20); // Bcrypt hash length
      }
    });

    it('should not return password in response', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.body.data.user).not.toHaveProperty('password');
      expect(res.body.data.user).toHaveProperty('username');
      expect(res.body.data.user).toHaveProperty('email');
    });

    it('should generate different tokens for different users', async () => {
      const res1 = await request(app)
        .post('/auth/register')
        .send({
          username: 'user1',
          email: 'user1@example.com',
          password: 'password123',
        });

      const res2 = await request(app)
        .post('/auth/register')
        .send({
          username: 'user2',
          email: 'user2@example.com',
          password: 'password123',
        });

      expect(res1.body.data.accessToken).not.toBe(res2.body.data.accessToken);
      expect(res1.body.data.refreshToken).not.toBe(res2.body.data.refreshToken);
    });
  });
});

