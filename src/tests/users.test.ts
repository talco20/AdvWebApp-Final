import request from 'supertest';
import app from '../app';

describe('Users API', () => {
  let accessToken: string;
  let userId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

    accessToken = res.body.data.accessToken;
    userId = res.body.data.user._id;
  });

  describe('GET /users/me', () => {
    it('should get current user profile', async () => {
      const res = await request(app)
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('username', 'testuser');
      expect(res.body.data).toHaveProperty('email', 'test@example.com');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should not get profile without authentication', async () => {
      const res = await request(app).get('/users/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /users/:id', () => {
    it('should get user by ID', async () => {
      const res = await request(app).get(`/users/${userId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id', userId);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app).get('/users/507f1f77bcf86cd799439011');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /users/me', () => {
    it('should update current user profile', async () => {
      const res = await request(app)
        .put('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: 'updateduser',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('username', 'updateduser');
    });

    it('should not update to existing username', async () => {
      // Create another user
      await request(app)
        .post('/auth/register')
        .send({
          username: 'existinguser',
          email: 'existing@example.com',
          password: 'password123',
        });

      const res = await request(app)
        .put('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          username: 'existinguser',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /users/:id/posts', () => {
    beforeEach(async () => {
      await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Post 1' });

      await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Post 2' });
    });

    it('should get user posts', async () => {
      const res = await request(app).get(`/users/${userId}/posts`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(2);
    });
  });
});


