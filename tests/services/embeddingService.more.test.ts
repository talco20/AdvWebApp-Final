describe('Embedding generation branches', () => {
    beforeEach(() => jest.resetModules());

    it('generateEmbedding returns vector when openai responds', async () => {
        process.env.OPENAI_API_KEY = 'x';
        jest.doMock('openai', () => {
            return class {
                embeddings = { create: jest.fn().mockResolvedValue({ data: [{ embedding: [0.1, 0.2, 0.3] }] }) };
            } as any;
        });
        const { generateEmbedding, generatePostEmbedding, generateUserEmbedding } = await import('../../src/services/embeddingService');
        const e = await generateEmbedding('hello');
        expect(e.length).toBeGreaterThan(0);
        const p = await generatePostEmbedding('hi', 'me');
        expect(Array.isArray(p)).toBe(true);
        const u = await generateUserEmbedding('me', 'me@x.com');
        expect(Array.isArray(u)).toBe(true);
    });

    it('generateEmbedding throws when text missing', async () => {
        process.env.OPENAI_API_KEY = 'x';
        jest.doMock('openai', () => {
            return class { embeddings = { create: jest.fn() } } as any;
        });
        const { generateEmbedding } = await import('../../src/services/embeddingService');
        await expect(generateEmbedding('')).rejects.toThrow('Text is required');
    });
});
