import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../src/models/postModel', () => {
    class MockPost {
        _id = 'post1';
        userId: any = { toString: () => 'owner' };
        content = 'hello';
        likesCount = 0;
        save = jest.fn().mockResolvedValue(true);
        populate = jest.fn().mockResolvedValue(this);
        toObject = jest.fn().mockReturnValue({ _id: 'post1', content: 'hello' });
        static find = jest.fn().mockReturnThis();
        static sort = jest.fn().mockReturnThis();
        static skip = jest.fn().mockReturnThis();
        static limit = jest.fn().mockReturnThis();
        static populate = jest.fn().mockResolvedValue([]);
        static countDocuments = jest.fn().mockResolvedValue(0);
        static findById = jest.fn();
        static findByIdAndDelete = jest.fn().mockResolvedValue(true);
    }
    return { __esModule: true, default: MockPost };
});

jest.mock('../src/models/likeModel', () => {
    class MockLike {
        _id = 'like1';
        save = jest.fn().mockResolvedValue(true);
        static find = jest.fn().mockResolvedValue([]);
        static findOne = jest.fn();
        static findByIdAndDelete = jest.fn();
        static deleteMany = jest.fn();
    }
    return { __esModule: true, default: MockLike };
});

jest.mock('../src/models/userModel', () => ({ __esModule: true, default: { findById: jest.fn() } }));

jest.mock('../src/services/embeddingService', () => ({ generatePostEmbedding: jest.fn().mockResolvedValue([0.1]) }));

import app from '../src/app';
import Post from '../src/models/postModel';
import Like from '../src/models/likeModel';

describe('Posts Module', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('GET /posts', () => {
        it('returns posts (200)', async () => {
            (Post as any).find = jest.fn().mockReturnThis();
            (Post as any).sort = jest.fn().mockReturnThis();
            (Post as any).skip = jest.fn().mockReturnThis();
            (Post as any).limit = jest.fn().mockReturnThis();
            (Post as any).populate = jest.fn().mockResolvedValue([]);
            (Post as any).countDocuments = jest.fn().mockResolvedValue(0);
            (Like as any).find = jest.fn().mockResolvedValue([]);
            const res = await request(app).get('/posts');
            expect(res.status).toBe(200);
        });
    });

    describe('GET /posts/:id', () => {
        it('returns 404 when not found', async () => {
            (Post as any).findById.mockImplementation(() => ({ populate: jest.fn().mockResolvedValue(null) }));
            const res = await request(app).get('/posts/1');
            expect(res.status).toBe(404);
        });

        it('returns 200 with post and isLiked false', async () => {
            (Post as any).findById.mockImplementation(() => ({ populate: jest.fn().mockResolvedValue({ _id: 'post1', toObject: () => ({ _id: 'post1' }) }) }));
            (Like as any).findOne = jest.fn().mockResolvedValue(null);
            const res = await request(app).get('/posts/post1');
            expect(res.status).toBe(200);
            expect(res.body.data.isLiked).toBe(false);
        });
    });

    describe('POST /posts', () => {
        it('returns 401 when unauthenticated', async () => {
            const res = await request(app).post('/posts').send({ content: 'x' });
            expect(res.status).toBe(401);
        });

        it('returns 400 when content missing', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'u' }));
            const res = await request(app).post('/posts').set('Authorization', 'Bearer ok').send({});
            expect(res.status).toBe(400);
        });

        it('creates post (201)', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'u' }));
            (Post as any).prototype.save = jest.fn().mockResolvedValue(true);
            (Post as any).prototype.populate = jest.fn().mockResolvedValue({ _id: 'post1' });
            const res = await request(app).post('/posts').set('Authorization', 'Bearer ok').field('content', 'hello');
            expect(res.status).toBe(201);
        });
    });

    describe('PUT /posts/:id', () => {
        it('returns 401 when unauthenticated', async () => {
            const res = await request(app).put('/posts/1').send({ content: 'x' });
            expect(res.status).toBe(401);
        });

        it('returns 404 when post not found', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'u' }));
            (Post as any).findById.mockResolvedValue(null);
            const res = await request(app).put('/posts/1').set('Authorization', 'Bearer ok').send({ content: 'x' });
            expect(res.status).toBe(404);
        });

        it('returns 403 when not owner', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'other' }));
            (Post as any).findById.mockResolvedValue({ _id: '1', userId: { toString: () => 'owner' }, content: 'a', save: jest.fn(), populate: jest.fn().mockResolvedValue({}) });
            const res = await request(app).put('/posts/1').set('Authorization', 'Bearer ok').send({ content: 'x' });
            expect(res.status).toBe(403);
        });

        it('updates post (200)', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'owner' }));
            (Post as any).findById.mockResolvedValue({ _id: '1', userId: { toString: () => 'owner' }, content: 'a', save: jest.fn(), populate: jest.fn().mockResolvedValue({}) });
            const res = await request(app).put('/posts/1').set('Authorization', 'Bearer ok').send({ content: 'new' });
            expect(res.status).toBe(200);
        });
    });

    describe('DELETE /posts/:id', () => {
        it('returns 401 when unauthenticated', async () => {
            const res = await request(app).delete('/posts/1');
            expect(res.status).toBe(401);
        });

        it('returns 404 when post not found', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'owner' }));
            (Post as any).findById.mockResolvedValue(null);
            const res = await request(app).delete('/posts/1').set('Authorization', 'Bearer ok');
            expect(res.status).toBe(404);
        });

        it('returns 403 when not owner', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'other' }));
            (Post as any).findById.mockResolvedValue({ _id: '1', userId: { toString: () => 'owner' } });
            const res = await request(app).delete('/posts/1').set('Authorization', 'Bearer ok');
            expect(res.status).toBe(403);
        });

        it('deletes post (200)', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'owner' }));
            (Post as any).findById.mockResolvedValue({ _id: '1', userId: { toString: () => 'owner' }, imageUrl: null });
            const res = await request(app).delete('/posts/1').set('Authorization', 'Bearer ok');
            expect(res.status).toBe(200);
        });
    });

    describe('POST /posts/:id/like', () => {
        it('returns 401 when unauthenticated', async () => {
            const res = await request(app).post('/posts/1/like');
            expect(res.status).toBe(401);
        });

        it('returns 404 when post not found', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'u' }));
            (Post as any).findById.mockResolvedValue(null);
            const res = await request(app).post('/posts/1/like').set('Authorization', 'Bearer ok');
            expect(res.status).toBe(404);
        });

        it('likes a post (200)', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'u' }));
            (Post as any).findById.mockResolvedValue({ _id: '1', userId: { toString: () => 'owner' }, likesCount: 0, save: jest.fn() });
            (Like as any).findOne.mockResolvedValue(null);
            (Like as any).prototype.save = jest.fn().mockResolvedValue(true);
            const res = await request(app).post('/posts/1/like').set('Authorization', 'Bearer ok');
            expect(res.status).toBe(200);
            expect(res.body.data.liked).toBeDefined();
        });
    });

    describe('GET /posts/:id/likes', () => {
        it('returns likes (200)', async () => {
            (Like as any).find = jest.fn().mockReturnThis();
            (Like as any).populate = jest.fn().mockResolvedValue([]);
            const res = await request(app).get('/posts/1/likes');
            expect(res.status).toBe(200);
        });
    });
});
