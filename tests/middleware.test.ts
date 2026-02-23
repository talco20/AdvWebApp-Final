import { authenticateToken, optionalAuth } from '../src/middleware/auth';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('authenticateToken - should return 401 when token missing', () => {
        const req: any = { headers: {} };
        const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();
        authenticateToken(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('authenticateToken - should return 403 when token invalid', () => {
        jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(new Error('bad')));
        const req: any = { headers: { authorization: 'Bearer bad' } };
        const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        const next = jest.fn();
        authenticateToken(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('authenticateToken - should call next when token valid', () => {
        jest.spyOn(jwt, 'verify').mockImplementation((_t: any, _s: any, cb: any) => cb(null, { userId: '1' }));
        const req: any = { headers: { authorization: 'Bearer good' } };
        const res: any = {};
        const next = jest.fn();
        authenticateToken(req, res as any, next);
        expect(next).toHaveBeenCalled();
        expect(req.user).toBeDefined();
    });

    it('optionalAuth - should call next when no token', () => {
        const req: any = { headers: {} };
        const res: any = {};
        const next = jest.fn();
        optionalAuth(req, res, next);
        expect(next).toHaveBeenCalled();
    });
});
