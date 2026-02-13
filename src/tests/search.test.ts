import request from 'supertest';
import app from '../app';

describe('Search API', () => {
  let accessToken: string;

  beforeEach(async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

    accessToken = res.body.data?.accessToken || '';
  });

  describe('POST /search/news', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/search/news')
        .send({ query: 'technology' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should validate required query field', async () => {
      const res = await request(app)
        .post('/search/news')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject empty query', async () => {
      const res = await request(app)
        .post('/search/news')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ query: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject very short query', async () => {
      const res = await request(app)
        .post('/search/news')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ query: 'a' });

      // Should return 500 because OpenAI sanitization rejects it
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    // Note: We don't test actual OpenAI API calls as per requirements
    // (external API excluded from tests)
  });

  describe('GET /search/history', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/search/history');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should get empty history for new user', async () => {
      const res = await request(app)
        .get('/search/history')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('POST /search/analyze', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/search/analyze')
        .send({ content: 'Test content' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should validate required content field', async () => {
      const res = await request(app)
        .post('/search/analyze')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject empty content', async () => {
      const res = await request(app)
        .post('/search/analyze')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    // Note: We don't test actual OpenAI API calls as per requirements
  });

  describe('POST /search/suggestions', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/search/suggestions')
        .send({ topic: 'technology' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should validate required topic field', async () => {
      const res = await request(app)
        .post('/search/suggestions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject empty topic', async () => {
      const res = await request(app)
        .post('/search/suggestions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ topic: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    // Note: We don't test actual OpenAI API calls as per requirements
  });
});

