import User from '../../src/models/userModel';
import bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('User Model methods', () => {
    afterEach(() => jest.clearAllMocks());

    it('toJSON removes sensitive fields', () => {
        const u: any = new (User as any)({ username: 'x', email: 'a@b.com', password: 'secret' });
        u.refreshTokens = ['r'];
        u.embedding = [0.1];
        const out = u.toJSON();
        expect(out.password).toBeUndefined();
        expect(out.refreshTokens).toBeUndefined();
        expect(out.embedding).toBeUndefined();
    });

    it('comparePassword returns boolean from bcrypt', async () => {
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);
        const u: any = new (User as any)({ username: 'x', email: 'a@b.com', password: 'hashed' });
        const ok = await u.comparePassword('plain');
        expect(ok).toBe(true);
    });
});
