import request from 'supertest';
import app from '../app';

describe('Comments API', () => {
  let accessToken: string;
  let postId: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

    accessToken = res.body.data?.accessToken || '';

    // Create a post
    const postRes = await request(app)
      .post('/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ content: 'Test post' });

    postId = postRes.body.data?._id || '';
  });

  describe('POST /comments', () => {
    it('should create a comment', async () => {
      const res = await request(app)
        .post('/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          postId,
          content: 'This is a test comment',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('content', 'This is a test comment');
      expect(res.body.data).toHaveProperty('postId', postId);
    });

    it('should not create comment without authentication', async () => {
      const res = await request(app)
        .post('/comments')
        .send({
          postId,
          content: 'Test comment',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should not create comment without required fields', async () => {
      const res = await request(app)
        .post('/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          postId,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /comments/post/:postId', () => {
    beforeEach(async () => {
      await request(app)
        .post('/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ postId, content: 'Comment 1' });

      await request(app)
        .post('/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ postId, content: 'Comment 2' });
    });

    it('should get comments for a post', async () => {
      const res = await request(app).get(`/comments/post/${postId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('PUT /comments/:id', () => {
    it('should update own comment', async () => {
      const createRes = await request(app)
        .post('/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ postId, content: 'Original comment' });

      const commentId = createRes.body.data._id;

      const res = await request(app)
        .put(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Updated comment' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('content', 'Updated comment');
    });
  });

  describe('DELETE /comments/:id', () => {
    it('should delete own comment', async () => {
      const createRes = await request(app)
        .post('/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ postId, content: 'Test comment' });

      const commentId = createRes.body.data._id;

      const res = await request(app)
        .delete(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

