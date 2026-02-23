import { getCurrentUser, getUserById, updateCurrentUser, uploadProfileImage } from '../../src/controllers/userController';
import User from '../../src/models/userModel';
import { AuthRequest } from '../../src/types';
import * as embeddingService from '../../src/services/embeddingService';
import fs from 'fs';

const mockRes = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as any;
};

afterEach(() => {
    jest.restoreAllMocks();
});

describe('userController', () => {
    test('getCurrentUser -> 401 when no user', async () => {
        const req = { user: undefined } as unknown as AuthRequest;
        const res = mockRes();

        await getCurrentUser(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('getCurrentUser -> 404 when user not found', async () => {
        jest.spyOn(User, 'findById' as any).mockResolvedValue(null);
        const req = { user: { userId: 'u1' } } as unknown as AuthRequest;
        const res = mockRes();

        await getCurrentUser(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('getCurrentUser -> 200 when found', async () => {
        const user = { _id: 'u1', username: 'bob' };
        jest.spyOn(User, 'findById' as any).mockResolvedValue(user);
        const req = { user: { userId: 'u1' } } as unknown as AuthRequest;
        const res = mockRes();

        await getCurrentUser(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('updateCurrentUser -> 400 when username taken', async () => {
        const foundUser = {
            _id: 'u1',
            username: 'alice',
            email: 'a@x.com',
            save: jest.fn().mockResolvedValue(undefined),
        } as any;

        jest.spyOn(User, 'findById' as any).mockResolvedValue(foundUser);
        jest.spyOn(User, 'findOne' as any).mockResolvedValue({ _id: 'other' });

        const req = { user: { userId: 'u1' }, body: { username: 'taken' } } as unknown as AuthRequest;
        const res = mockRes();

        await updateCurrentUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('updateCurrentUser -> regenerating embedding fails but still returns 200', async () => {
        const foundUser = {
            _id: 'u1',
            username: 'alice',
            email: 'a@x.com',
            embedding: undefined,
            save: jest.fn().mockResolvedValue(undefined),
        } as any;

        jest.spyOn(User, 'findById' as any).mockResolvedValue(foundUser);
        jest.spyOn(User, 'findOne' as any).mockResolvedValue(null);
        jest.spyOn(embeddingService, 'generateUserEmbedding' as any).mockRejectedValue(new Error('fail'));

        const req = { user: { userId: 'u1' }, body: { username: 'newname' } } as unknown as AuthRequest;
        const res = mockRes();

        await updateCurrentUser(req, res);

        expect(foundUser.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('uploadProfileImage -> 400 when no file', async () => {
        const req = { user: { userId: 'u1' }, file: undefined } as unknown as AuthRequest;
        const res = mockRes();

        await uploadProfileImage(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('uploadProfileImage -> deletes old image when exists and returns 200', async () => {
        const mockUnlink = jest.spyOn(fs, 'unlinkSync' as any).mockImplementation(() => { });
        jest.spyOn(fs, 'existsSync' as any).mockReturnValue(true);

        const foundUser = {
            _id: 'u1',
            profileImage: '/uploads/old.png',
            save: jest.fn().mockResolvedValue(undefined),
        } as any;

        jest.spyOn(User, 'findById' as any).mockResolvedValue(foundUser);

        const req = { user: { userId: 'u1' }, file: { filename: 'new.png' } } as unknown as AuthRequest;
        const res = mockRes();

        await uploadProfileImage(req, res);

        expect(mockUnlink).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });
});
