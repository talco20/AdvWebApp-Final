import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../src/models/commentModel', () => {
    class MockComment {
        _id = 'c1';
        postId = 'p1';
        userId = { toString: () => 'u1' };
        content = 'hey';
        save = jest.fn().mockResolvedValue(true);
        populate = jest.fn().mockResolvedValue(this);
        toObject = jest.fn().mockReturnValue({ _id: 'c1', content: 'hey' });
        static find = jest.fn().mockReturnThis();
        static sort = jest.fn().mockReturnThis();
        static skip = jest.fn().mockReturnThis();
        static limit = jest.fn().mockReturnThis();
        static populate = jest.fn().mockResolvedValue([]);
        static countDocuments = jest.fn().mockResolvedValue(0);
        static findById = jest.fn();
        static findByIdAndDelete = jest.fn();
    }
    return { __esModule: true, default: MockComment };
});

jest.mock('../src/models/postModel', () => ({ __esModule: true, default: { findById: jest.fn(), prototype: { save: jest.fn() } } }));

import app from '../src/app';
import Comment from '../src/models/commentModel';
import Post from '../src/models/postModel';

describe('Comments Module', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('GET /comments/post/:postId', () => {
        it('returns comments (200)', async () => {
            (Comment as any).find = jest.fn().mockReturnThis();
            (Comment as any).sort = jest.fn().mockReturnThis();
            (Comment as any).skip = jest.fn().mockReturnThis();
            (Comment as any).limit = jest.fn().mockReturnThis();
            (Comment as any).populate = jest.fn().mockResolvedValue([]);
            (Comment as any).countDocuments = jest.fn().mockResolvedValue(0);
            const res = await request(app).get('/comments/post/p1');
            expect(res.status).toBe(200);
            expect(res.body.pagination).toBeDefined();
        });
    });

    describe('POST /comments', () => {
        it('returns 401 when unauthenticated', async () => {
            const res = await request(app).post('/comments').send({ postId: 'p1', content: 'hi' });
            expect(res.status).toBe(401);
        });

        it('returns 400 when missing fields', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'u1' }));
            const res = await request(app).post('/comments').set('Authorization', 'Bearer ok').send({ postId: '' });
            expect(res.status).toBe(400);
        });

        it('returns 404 when post not found', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'u1' }));
            (Post as any).findById.mockResolvedValue(null);
            const res = await request(app).post('/comments').set('Authorization', 'Bearer ok').send({ postId: 'p1', content: 'hi' });
            expect(res.status).toBe(404);
        });

        it('creates comment (201)', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'u1' }));
            (Post as any).findById.mockResolvedValue({ _id: 'p1', commentsCount: 0, save: jest.fn() });
            (Comment as any).prototype.save = jest.fn().mockResolvedValue(true);
            const res = await request(app).post('/comments').set('Authorization', 'Bearer ok').send({ postId: 'p1', content: 'hi' });
            expect(res.status).toBe(201);
        });
    });

    describe('PUT /comments/:id', () => {
        it('returns 401 when unauthenticated', async () => {
            const res = await request(app).put('/comments/c1').send({ content: 'x' });
            expect(res.status).toBe(401);
        });

        it('returns 400 when content missing', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'u1' }));
            const res = await request(app).put('/comments/c1').set('Authorization', 'Bearer ok').send({});
            expect(res.status).toBe(400);
        });

        it('returns 404 when comment not found', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'u1' }));
            (Comment as any).findById.mockResolvedValue(null);
            const res = await request(app).put('/comments/c1').set('Authorization', 'Bearer ok').send({ content: 'x' });
            expect(res.status).toBe(404);
        });

        it('returns 403 when not owner', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'u2' }));
            (Comment as any).findById.mockResolvedValue({ _id: 'c1', userId: { toString: () => 'u1' } });
            const res = await request(app).put('/comments/c1').set('Authorization', 'Bearer ok').send({ content: 'x' });
            expect(res.status).toBe(403);
        });

        it('updates comment (200)', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'u1' }));
            (Comment as any).findById.mockResolvedValue({ _id: 'c1', userId: { toString: () => 'u1' }, content: 'old', save: jest.fn(), populate: jest.fn().mockResolvedValue({}) });
            const res = await request(app).put('/comments/c1').set('Authorization', 'Bearer ok').send({ content: 'new' });
            expect(res.status).toBe(200);
        });
    });

    describe('DELETE /comments/:id', () => {
        it('returns 401 when unauthenticated', async () => {
            const res = await request(app).delete('/comments/c1');
            expect(res.status).toBe(401);
        });

        it('returns 404 when not found', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'u1' }));
            (Comment as any).findById.mockResolvedValue(null);
            const res = await request(app).delete('/comments/c1').set('Authorization', 'Bearer ok');
            expect(res.status).toBe(404);
        });

        it('returns 403 when not owner', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'u2' }));
            (Comment as any).findById.mockResolvedValue({ _id: 'c1', userId: { toString: () => 'u1' } });
            const res = await request(app).delete('/comments/c1').set('Authorization', 'Bearer ok');
            expect(res.status).toBe(403);
        });

        it('deletes comment (200)', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'u1' }));
            (Comment as any).findById.mockResolvedValue({ _id: 'c1', userId: { toString: () => 'u1' }, postId: 'p1' });
            (Post as any).findById.mockResolvedValue({ _id: 'p1', commentsCount: 1, save: jest.fn() });
            const res = await request(app).delete('/comments/c1').set('Authorization', 'Bearer ok');
            expect(res.status).toBe(200);
        });
    });
});
