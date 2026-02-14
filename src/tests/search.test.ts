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
});

