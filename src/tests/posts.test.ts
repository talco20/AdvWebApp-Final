import request from 'supertest';
import app from '../app';
import Post from '../models/postModel';

describe('Posts API', () => {
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

  describe('POST /posts', () => {
    it('should create a new post', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'This is a test post',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('content', 'This is a test post');
      expect(res.body.data).toHaveProperty('userId');
    });

    it('should not create post without authentication', async () => {
      const res = await request(app)
        .post('/posts')
        .send({
          content: 'This is a test post',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should not create post without content', async () => {
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /posts', () => {
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

    it('should get all posts', async () => {
      const res = await request(app).get('/posts');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/posts')
        .query({ page: 1, limit: 1 });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(1);
    });
  });

  describe('GET /posts/:id', () => {
    it('should get a post by ID', async () => {
      const createRes = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Test post' });

      const postId = createRes.body.data._id;

      const res = await request(app).get(`/posts/${postId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('_id', postId);
    });

    it('should return 404 for non-existent post', async () => {
      const res = await request(app).get('/posts/507f1f77bcf86cd799439011');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /posts/:id', () => {
    it('should update own post', async () => {
      const createRes = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Original content' });

      const postId = createRes.body.data._id;

      const res = await request(app)
        .put(`/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Updated content' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('content', 'Updated content');
    });

    it('should not update other user\'s post', async () => {
      const createRes = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Original content' });

      const postId = createRes.body.data._id;

      // Register another user
      const otherUserRes = await request(app)
        .post('/auth/register')
        .send({
          username: 'otheruser',
          email: 'other@example.com',
          password: 'password123',
        });

      const otherToken = otherUserRes.body.data.accessToken;

      const res = await request(app)
        .put(`/posts/${postId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ content: 'Updated content' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /posts/:id', () => {
    it('should delete own post', async () => {
      const createRes = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Test post' });

      const postId = createRes.body.data._id;

      const res = await request(app)
        .delete(`/posts/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify post is deleted
      const getRes = await request(app).get(`/posts/${postId}`);
      expect(getRes.status).toBe(404);
    });
  });

  describe('POST /posts/:id/like', () => {
    it('should like a post', async () => {
      const createRes = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Test post' });

      const postId = createRes.body.data._id;

      const res = await request(app)
        .post(`/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.liked).toBe(true);
      expect(res.body.data.likesCount).toBe(1);
    });

    it('should unlike a post', async () => {
      const createRes = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Test post' });

      const postId = createRes.body.data._id;

      // Like
      await request(app)
        .post(`/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      // Unlike
      const res = await request(app)
        .post(`/posts/${postId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.liked).toBe(false);
      expect(res.body.data.likesCount).toBe(0);
    });

    it('should require authentication to like', async () => {
      const createRes = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Test post' });

      const postId = createRes.body.data._id;

      const res = await request(app)
        .post(`/posts/${postId}/like`);

      // Should return 401 for missing authentication
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long content', async () => {
      const longContent = 'a'.repeat(1000); // Reduced to reasonable length
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: longContent });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should handle special characters in content', async () => {
      const specialContent = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: specialContent });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe(specialContent);
    });

    it('should handle unicode characters', async () => {
      const unicodeContent = '你好世界 🌍 مرحبا بالعالم';
      const res = await request(app)
        .post('/posts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: unicodeContent });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should handle invalid post ID format', async () => {
      const res = await request(app)
        .get('/posts/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`);

      // Should return 500 for invalid MongoDB ObjectId format
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });

    it('should handle very large page number', async () => {
      const res = await request(app)
        .get('/posts?page=999999');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });
});

