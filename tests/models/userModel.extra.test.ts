import User from '../../src/models/userModel';
import bcrypt from 'bcrypt';

afterEach(() => {
    jest.restoreAllMocks();
});

describe('User model methods', () => {
    test('comparePassword returns false when no password set', async () => {
        const u: any = new User();
        u.password = undefined;
        const ok = await u.comparePassword('x');
        expect(ok).toBe(false);
    });

    test('comparePassword delegates to bcrypt.compare', async () => {
        const u: any = new User();
        u.password = 'hashed';
        jest.spyOn(bcrypt, 'compare' as any).mockResolvedValue(true);
        const ok = await u.comparePassword('plain');
        expect(ok).toBe(true);
    });

    test('toJSON removes sensitive fields', () => {
        const u: any = new User({ username: 'x', email: 'e@e.com', password: 'p', refreshTokens: ['a'], embedding: [1] });
        // Ensure toObject returns a plain object; mongoose Document implements toObject but our instance should too
        const obj = u.toJSON();
        expect(obj).not.toHaveProperty('password');
        expect(obj).not.toHaveProperty('refreshTokens');
        expect(obj).not.toHaveProperty('embedding');
    });
});
