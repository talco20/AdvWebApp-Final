import {
    getAllPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    toggleLike,
    getPostLikes,
} from '../../src/controllers/postController';
import Post from '../../src/models/postModel';
import Like from '../../src/models/likeModel';
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

describe('postController', () => {
    test('createPost -> 401 when no auth', async () => {
        const req = { user: undefined, body: { content: 'hi' } } as unknown as AuthRequest;
        const res = mockRes();

        await createPost(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('createPost -> 400 when no content', async () => {
        const req = { user: { userId: 'u1' }, body: {} } as unknown as AuthRequest;
        const res = mockRes();

        await createPost(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('updatePost -> 401 when not authenticated', async () => {
        const req = { user: undefined, params: { id: 'p1' }, body: {} } as unknown as AuthRequest;
        const res = mockRes();

        await updatePost(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('updatePost -> 404 when post not found', async () => {
        jest.spyOn(Post, 'findById' as any).mockResolvedValue(null);
        const req = { user: { userId: 'u1' }, params: { id: 'p1' }, body: {} } as unknown as AuthRequest;
        const res = mockRes();

        await updatePost(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('updatePost -> 403 when not owner', async () => {
        const post = { _id: 'p1', userId: 'ownerId', save: jest.fn(), content: 'a' } as any;
        jest.spyOn(Post, 'findById' as any).mockResolvedValue(post);
        const req = { user: { userId: 'u1' }, params: { id: 'p1' }, body: {} } as unknown as AuthRequest;
        const res = mockRes();

        await updatePost(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('toggleLike -> 401 when not authenticated', async () => {
        const req = { user: undefined, params: { id: 'p1' } } as unknown as AuthRequest;
        const res = mockRes();

        await toggleLike(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('toggleLike -> 404 when post not found', async () => {
        jest.spyOn(Post, 'findById' as any).mockResolvedValue(null);
        const req = { user: { userId: 'u1' }, params: { id: 'p1' } } as unknown as AuthRequest;
        const res = mockRes();

        await toggleLike(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('toggleLike -> unlike branch', async () => {
        const post = { _id: 'p1', likesCount: 1, save: jest.fn() } as any;
        jest.spyOn(Post, 'findById' as any).mockResolvedValue(post);
        jest.spyOn(Like, 'findOne' as any).mockResolvedValue({ _id: 'l1', postId: 'p1' });
        jest.spyOn(Like, 'findByIdAndDelete' as any).mockResolvedValue(undefined);

        const req = { user: { userId: 'u1' }, params: { id: 'p1' } } as unknown as AuthRequest;
        const res = mockRes();

        await toggleLike(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('toggleLike -> like branch', async () => {
        const post = { _id: 'p1', likesCount: 0, save: jest.fn() } as any;
        jest.spyOn(Post, 'findById' as any).mockResolvedValue(post);
        jest.spyOn(Like, 'findOne' as any).mockResolvedValue(null);
        jest.spyOn(Like.prototype, 'save' as any).mockResolvedValue(undefined);

        const req = { user: { userId: 'u1' }, params: { id: 'p1' } } as unknown as AuthRequest;
        const res = mockRes();

        await toggleLike(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    test('getPostLikes -> returns list', async () => {
        const fakeQuery: any = { populate: jest.fn().mockResolvedValue([{ _id: 'l1', userId: { username: 'x' } }]) };
        jest.spyOn(Like, 'find' as any).mockReturnValue(fakeQuery);
        const req = { params: { id: 'p1' } } as unknown as AuthRequest;
        const res = mockRes();

        await getPostLikes(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });
});
