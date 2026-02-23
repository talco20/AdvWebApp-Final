import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../src/models/userModel', () => {
    class MockUser {
        _id = '507f1f77bcf86cd799439011';
        username = 'u';
        email = 'u@example.com';
        profileImage: any = null;
        refreshTokens: string[] = [];
        save = jest.fn().mockResolvedValue(true);
        static findById = jest.fn();
        static findOne = jest.fn();
    }
    return { __esModule: true, default: MockUser };
});

jest.mock('../src/models/postModel', () => ({
    __esModule: true,
    default: {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([]),
        countDocuments: jest.fn().mockResolvedValue(0),
    },
}));

import app from '../src/app';
import User from '../src/models/userModel';
import Post from '../src/models/postModel';

describe('Users Module', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('GET /users/me', () => {
        it('returns 401 when unauthenticated', async () => {
            const res = await request(app).get('/users/me');
            expect(res.status).toBe(401);
        });

        it('returns 200 with user data', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: '507f1f77bcf86cd799439011' }));
            (User as any).findById.mockResolvedValue({ _id: '507f1f77bcf86cd799439011', username: 'u' });
            const res = await request(app).get('/users/me').set('Authorization', 'Bearer ok');
            expect(res.status).toBe(200);
            expect(res.body.data).toBeDefined();
        });

        it('returns 404 if user not found', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'no' }));
            (User as any).findById.mockResolvedValue(null);
            const res = await request(app).get('/users/me').set('Authorization', 'Bearer ok');
            expect(res.status).toBe(404);
        });
    });

    describe('GET /users/:id', () => {
        it('returns 200 when user exists', async () => {
            (User as any).findById.mockResolvedValue({ _id: '1', username: 'u' });
            const res = await request(app).get('/users/1');
            expect(res.status).toBe(200);
        });

        it('returns 404 when not found', async () => {
            (User as any).findById.mockResolvedValue(null);
            const res = await request(app).get('/users/2');
            expect(res.status).toBe(404);
        });
    });

    describe('PUT /users/me', () => {
        it('returns 401 when unauthenticated', async () => {
            const res = await request(app).put('/users/me').send({ username: 'x' });
            expect(res.status).toBe(401);
        });

        it('returns 400 when username taken', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'me' }));
            (User as any).findById.mockResolvedValue({ _id: 'me', username: 'old', email: 'a@b.com', save: jest.fn() });
            (User as any).findOne.mockResolvedValue({ _id: 'other' });
            const res = await request(app).put('/users/me').set('Authorization', 'Bearer ok').send({ username: 'taken' });
            expect(res.status).toBe(400);
        });

        it('updates username (200)', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'me' }));
            (User as any).findById.mockResolvedValue({ _id: 'me', username: 'old', email: 'a@b.com', save: jest.fn() });
            (User as any).findOne.mockResolvedValue(null);
            const res = await request(app).put('/users/me').set('Authorization', 'Bearer ok').send({ username: 'newname' });
            expect(res.status).toBe(200);
        });
    });

    describe('POST /users/me/image', () => {
        it('returns 401 when unauthenticated', async () => {
            const res = await request(app).post('/users/me/image');
            expect(res.status).toBe(401);
        });

        it('returns 400 when no file provided', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'me' }));
            (User as any).findById.mockResolvedValue({ _id: 'me', username: 'old', save: jest.fn() });
            const res = await request(app).post('/users/me/image').set('Authorization', 'Bearer ok');
            expect(res.status).toBe(400);
        });

        it('uploads image successfully (200)', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: 'me' }));
            (User as any).findById.mockResolvedValue({ _id: 'me', username: 'old', profileImage: null, save: jest.fn() });
            const res = await request(app).post('/users/me/image').set('Authorization', 'Bearer ok').attach('image', Buffer.from('a'), 'image.png');
            expect(res.status).toBe(200);
        });
    });

    describe('GET /users/:id/posts', () => {
        it('returns posts (200)', async () => {
            (Post as any).find = jest.fn().mockReturnThis();
            (Post as any).sort = jest.fn().mockReturnThis();
            (Post as any).skip = jest.fn().mockReturnThis();
            (Post as any).limit = jest.fn().mockReturnThis();
            (Post as any).populate = jest.fn().mockResolvedValue([]);
            (Post as any).countDocuments = jest.fn().mockResolvedValue(0);
            const res = await request(app).get('/users/1/posts');
            expect(res.status).toBe(200);
            expect(res.body.pagination).toBeDefined();
        });
    });
});
