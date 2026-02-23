import request from 'supertest';
import jwt from 'jsonwebtoken';

jest.mock('../src/models/userModel', () => {
    class MockUser {
        _id = '507f191e810c19729de860ea';
        username = 'testuser';
        email = 'test@example.com';
        password = 'hashed';
        refreshTokens: string[] = [];
        save = jest.fn().mockResolvedValue(true);
        comparePassword = jest.fn().mockResolvedValue(true);
        toJSON = function () {
            const obj: any = { _id: this._id, username: this.username, email: this.email, profileImage: null };
            return obj;
        };
        static findOne = jest.fn();
        static findById = jest.fn();
    }
    return {
        __esModule: true,
        default: MockUser,
    };
});

jest.mock('../src/services/embeddingService', () => ({
    generateUserEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}));

jest.mock('google-auth-library', () => ({
    OAuth2Client: jest.fn().mockImplementation(() => ({
        verifyIdToken: jest.fn().mockResolvedValue({
            getPayload: () => ({ email: 'google@example.com', sub: 'google-sub', picture: 'img', name: 'G User' }),
        }),
    })),
}));

import app from '../src/app';
import User from '../src/models/userModel';
import { config } from '../src/config';

describe('Auth Module', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('/auth/register', () => {
        it('should register a new user (201)', async () => {
            (User as any).findOne.mockResolvedValue(null);

            const res = await request(app)
                .post('/auth/register')
                .field('username', 'newuser')
                .field('email', 'new@example.com')
                .field('password', 'password123');

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.refreshToken).toBeDefined();
        });

        it('should return 400 for missing fields', async () => {
            const res = await request(app).post('/auth/register').send({ email: 'a@a.com' });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 400 for invalid email', async () => {
            const res = await request(app).post('/auth/register').send({ username: 'u', email: 'invalid', password: 'pass123' });
            expect(res.status).toBe(400);
        });

        it('should return 400 when user exists', async () => {
            (User as any).findOne.mockResolvedValue({ _id: 'exists' });
            const res = await request(app).post('/auth/register').send({ username: 'u', email: 'a@b.com', password: 'password' });
            expect(res.status).toBe(400);
        });
    });

    describe('/auth/login', () => {
        it('should login successfully (200)', async () => {
            (User as any).findOne.mockResolvedValue(new (User as any)());
            const res = await request(app).post('/auth/login').send({ email: 'test@example.com', password: 'password' });
            expect(res.status).toBe(200);
            expect(res.body.data.accessToken).toBeDefined();
        });

        it('should return 400 for missing fields', async () => {
            const res = await request(app).post('/auth/login').send({ email: 'a@b.com' });
            expect(res.status).toBe(400);
        });

        it('should return 401 for invalid credentials', async () => {
            (User as any).findOne.mockResolvedValue(null);
            const res = await request(app).post('/auth/login').send({ email: 'no@user.com', password: 'x' });
            expect(res.status).toBe(401);
        });
    });

    describe('/auth/refresh', () => {
        it('should return 400 when refresh token missing', async () => {
            const res = await request(app).post('/auth/refresh').send({});
            expect(res.status).toBe(400);
        });

        it('should return 403 for invalid refresh token', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_token: any, _secret: any, cb: any) => cb(new Error('invalid')));
            const res = await request(app).post('/auth/refresh').send({ refreshToken: 'bad' });
            expect(res.status).toBe(403);
        });

        it('should refresh token successfully (200)', async () => {
            jest.spyOn(jwt, 'verify').mockImplementation((_token: any, _secret: any, cb: any) => cb(null, { userId: '507f191e810c19729de860ea' }));
            (User as any).findById.mockResolvedValue({ _id: '507f191e810c19729de860ea', email: 'a@b.com', refreshTokens: ['good'] });
            const res = await request(app).post('/auth/refresh').send({ refreshToken: 'good' });
            expect(res.status).toBe(200);
            expect(res.body.data.accessToken).toBeDefined();
        });
    });

    describe('/auth/logout', () => {
        it('should return 401 when unauthenticated', async () => {
            const res = await request(app).post('/auth/logout').send({ refreshToken: 'x' });
            expect(res.status).toBe(401);
        });

        it('should logout successfully (200)', async () => {
            // mock jwt verify used by middleware
            jest.spyOn(jwt, 'verify').mockImplementation((_token: any, _secret: any, cb: any) => cb(null, { userId: '507f191e810c19729de860ea' }));
            (User as any).findById.mockResolvedValue({ _id: '507f191e810c19729de860ea', refreshTokens: ['toremove'], save: jest.fn() });
            const res = await request(app).post('/auth/logout').set('Authorization', 'Bearer token').send({ refreshToken: 'toremove' });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('/auth/google', () => {
        it('should authenticate via Google (200)', async () => {
            const res = await request(app).post('/auth/google').send({ credential: 'google-token' });
            expect(res.status).toBe(200);
            expect(res.body.data.accessToken).toBeDefined();
        });

        it('should return 400 for invalid google token', async () => {
            // Recreate app with google-auth-library mocked to return empty payload
            jest.resetModules();
            jest.doMock('google-auth-library', () => ({
                OAuth2Client: jest.fn().mockImplementation(() => ({
                    verifyIdToken: jest.fn().mockResolvedValue({ getPayload: () => ({}) }),
                })),
            }));
            // re-mock other dependencies used during app load
            jest.doMock('../src/models/userModel', () => {
                class MockUser { }
                return { __esModule: true, default: MockUser };
            });
            const app2 = require('../src/app').default;
            const res = await request(app2).post('/auth/google').send({ credential: 'bad' });
            expect(res.status).toBe(400);
        });
    });
});
