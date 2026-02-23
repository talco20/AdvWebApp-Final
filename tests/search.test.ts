import request from 'supertest';

jest.mock('../src/services/aiService', () => ({
    searchNews: jest.fn().mockResolvedValue([{ title: 'T', summary: 'S', relevance: 'R', category: 'World' }]),
}));

jest.mock('../src/services/embeddingService', () => ({
    generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2]),
    cosineSimilarity: jest.fn().mockImplementation((a: any, b: any) => 0.9),
}));

jest.mock('../src/models/searchHistoryModel', () => {
    return jest.fn().mockImplementation(() => ({ save: jest.fn().mockResolvedValue(true) }));
});

jest.mock('../src/models/postModel', () => ({
    find: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([{ _id: 'p1', embedding: [0.1, 0.2], toObject: () => ({ _id: 'p1' }) }]),
}));

jest.mock('../src/models/userModel', () => ({
    find: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([{ _id: 'u1', embedding: [0.1, 0.2], toObject: () => ({ _id: 'u1' }) }]),
}));

import app from '../src/app';
import jwt from 'jsonwebtoken';

describe('Search Controller', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('POST /search/news', () => {
        it('returns 401 when unauthenticated', async () => {
            const res = await request(app).post('/search/news').send({ query: 'x' });
            expect(res.status).toBe(401);
        });

        it('returns 400 for invalid query', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: '1' }));
            const res = await request(app).post('/search/news').set('Authorization', 'Bearer ok').send({ query: '' });
            expect(res.status).toBe(400);
        });

        it('returns 200 with results', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: '1' }));
            const res = await request(app).post('/search/news').set('Authorization', 'Bearer ok').send({ query: 'news' });
            expect(res.status).toBe(200);
            expect(res.body.data.results).toBeDefined();
        });
    });

    describe('POST /search/posts', () => {
        it('returns 401 when unauthenticated', async () => {
            const res = await request(app).post('/search/posts').send({ query: 'x' });
            expect(res.status).toBe(401);
        });

        it('returns 200 with post results', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: '1' }));
            const res = await request(app).post('/search/posts').set('Authorization', 'Bearer ok').send({ query: 'topic' });
            expect(res.status).toBe(200);
            expect(res.body.data.results).toBeDefined();
        });
    });

    describe('POST /search/users', () => {
        it('returns 401 when unauthenticated', async () => {
            const res = await request(app).post('/search/users').send({ query: 'x' });
            expect(res.status).toBe(401);
        });

        it('returns 200 with user results', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: '1' }));
            const res = await request(app).post('/search/users').set('Authorization', 'Bearer ok').send({ query: 'someone' });
            expect(res.status).toBe(200);
            expect(res.body.data.results).toBeDefined();
        });
    });
});
