import { register, login, refresh, logout, googleAuth } from '../../src/controllers/authController';
import User from '../../src/models/userModel';
import * as embeddingService from '../../src/services/embeddingService';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const mockRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as any;
};

afterEach(() => {
    jest.restoreAllMocks();
});

describe('authController', () => {
    describe('register', () => {
        test('returns 400 when missing fields', async () => {
            const req: any = { body: { username: '', email: '', password: '' } };
            const res = mockRes();

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('returns 400 for invalid email', async () => {
            const req: any = { body: { username: 'bob', email: 'not-an-email', password: '123456' } };
            const res = mockRes();

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('returns 400 for short password', async () => {
            const req: any = { body: { username: 'bob', email: 'b@example.com', password: '1' } };
            const res = mockRes();

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('returns 400 when user exists', async () => {
            jest.spyOn(User, 'findOne' as any).mockResolvedValue({ _id: 'u1' });
            const req: any = { body: { username: 'bob', email: 'b@example.com', password: '123456' } };
            const res = mockRes();

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('creates user and continues when embedding fails', async () => {
            jest.spyOn(User, 'findOne' as any).mockResolvedValue(null);
            jest.spyOn(embeddingService, 'generateUserEmbedding' as any).mockRejectedValue(new Error('emb-fail'));

            // Ensure instance.save sets up refreshTokens so subsequent push won't throw
            jest.spyOn(User.prototype, 'save' as any).mockImplementation(function (this: any) {
                if (!this.refreshTokens) this.refreshTokens = [];
                return Promise.resolve();
            });

            const req: any = { body: { username: 'bob', email: 'b@example.com', password: '123456' } };
            const res = mockRes();

            await register(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe('login', () => {
        test('returns 400 when missing', async () => {
            const req: any = { body: { email: '', password: '' } };
            const res = mockRes();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('returns 401 when user not found', async () => {
            jest.spyOn(User, 'findOne' as any).mockResolvedValue(null);
            const req: any = { body: { email: 'x@x.com', password: 'pw' } };
            const res = mockRes();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        test('returns 401 when password invalid', async () => {
            const user: any = { comparePassword: jest.fn().mockResolvedValue(false) };
            jest.spyOn(User, 'findOne' as any).mockResolvedValue(user);
            const req: any = { body: { email: 'x@x.com', password: 'pw' } };
            const res = mockRes();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        test('returns 200 on success', async () => {
            const user: any = { comparePassword: jest.fn().mockResolvedValue(true), refreshTokens: [], save: jest.fn().mockResolvedValue(undefined), _id: 'u1', email: 'x@x.com' };
            jest.spyOn(User, 'findOne' as any).mockResolvedValue(user);
            const req: any = { body: { email: 'x@x.com', password: 'pw' } };
            const res = mockRes();

            await login(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('refresh', () => {
        test('returns 400 when no token', async () => {
            const req: any = { body: {} };
            const res = mockRes();

            await refresh(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('returns 403 when jwt verify errors', async () => {
            jest.spyOn(jwt, 'verify' as any).mockImplementation((t: any, s: any, cb: any) => cb(new Error('bad')));
            const req: any = { body: { refreshToken: 'rt' } };
            const res = mockRes();

            await refresh(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('returns 403 when refresh token not in user', async () => {
            const payload = { userId: 'u1', email: 'x@x.com' };
            jest.spyOn(jwt, 'verify' as any).mockImplementation((t: any, s: any, cb: any) => cb(null, payload));
            jest.spyOn(User, 'findById' as any).mockResolvedValue({ refreshTokens: [] });
            const req: any = { body: { refreshToken: 'rt' } };
            const res = mockRes();

            await refresh(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('returns 200 on success', async () => {
            const payload = { userId: 'u1', email: 'x@x.com' };
            jest.spyOn(jwt, 'verify' as any).mockImplementation((t: any, s: any, cb: any) => cb(null, payload));
            jest.spyOn(User, 'findById' as any).mockResolvedValue({ _id: 'u1', email: 'x@x.com', refreshTokens: ['rt'] });
            const req: any = { body: { refreshToken: 'rt' } };
            const res = mockRes();

            await refresh(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('logout', () => {
        test('returns 401 when no user', async () => {
            const req: any = { body: {}, user: undefined };
            const res = mockRes();

            await logout(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        test('removes refresh token and returns 200', async () => {
            const user: any = { refreshTokens: ['rt'], save: jest.fn().mockResolvedValue(undefined) };
            jest.spyOn(User, 'findById' as any).mockResolvedValue(user);
            const req: any = { body: { refreshToken: 'rt' }, user: { userId: 'u1' } };
            const res = mockRes();

            await logout(req, res);

            expect(user.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('googleAuth', () => {
        test('returns 400 when payload missing', async () => {
            jest.spyOn(OAuth2Client.prototype, 'verifyIdToken' as any).mockResolvedValue({ getPayload: () => ({}) } as any);
            const req: any = { body: { credential: 'token' } };
            const res = mockRes();

            await googleAuth(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('creates new user when none exists and embedding fails (continues)', async () => {
            const payload = { email: 'g@x.com', sub: 'gid', picture: 'p', name: 'G' };
            jest.spyOn(OAuth2Client.prototype, 'verifyIdToken' as any).mockResolvedValue({ getPayload: () => payload } as any);
            jest.spyOn(User, 'findOne' as any).mockResolvedValue(null);
            jest.spyOn(embeddingService, 'generateUserEmbedding' as any).mockRejectedValue(new Error('fail'));

            // When new User().save is called ensure refreshTokens exists so later push won't throw
            jest.spyOn(User.prototype, 'save' as any).mockImplementation(function (this: any) {
                if (!this.refreshTokens) this.refreshTokens = [];
                return Promise.resolve();
            });

            const req: any = { body: { credential: 'token' } };
            const res = mockRes();

            await googleAuth(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('links googleId to existing user without googleId', async () => {
            const payload = { email: 'g@x.com', sub: 'gid', picture: 'p', name: 'G' };
            jest.spyOn(OAuth2Client.prototype, 'verifyIdToken' as any).mockResolvedValue({ getPayload: () => payload } as any);
            const existingUser: any = { _id: 'u1', googleId: undefined, save: jest.fn().mockResolvedValue(undefined), username: 'u', refreshTokens: [] };
            jest.spyOn(User, 'findOne' as any).mockResolvedValue(existingUser);

            const req: any = { body: { credential: 'token' } };
            const res = mockRes();

            await googleAuth(req, res);

            expect(existingUser.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
