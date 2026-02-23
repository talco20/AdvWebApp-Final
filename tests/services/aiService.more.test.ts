describe('AI Service parsing branches', () => {
    beforeEach(() => jest.resetModules());

    it('throws when no output_text in response', async () => {
        process.env.OPENAI_API_KEY = 'x';
        jest.doMock('openai', () => {
            return class {
                responses = { create: jest.fn().mockResolvedValue({ output_text: '' }) };
            } as any;
        });
        const { searchNews } = await import('../../src/services/aiService');
        await expect(searchNews('ok')).rejects.toThrow('No response from OpenAI Web Search');
    });

    it('parses JSON array response', async () => {
        process.env.OPENAI_API_KEY = 'x';
        jest.doMock('openai', () => {
            return class {
                responses = { create: jest.fn().mockResolvedValue({ output_text: JSON.stringify({ articles: [{ title: 'A' }, { title: 'B' }] }) }) };
            } as any;
        });
        const { searchNews } = await import('../../src/services/aiService');
        const res = await searchNews('ok');
        expect(Array.isArray(res)).toBe(true);
        expect(res.length).toBeGreaterThan(0);
    });

    it('parses object with results/news fields', async () => {
        process.env.OPENAI_API_KEY = 'x';
        jest.doMock('openai', () => {
            return class {
                responses = { create: jest.fn().mockResolvedValue({ output_text: JSON.stringify({ results: [{ title: 'X' }], news: [{ title: 'Y' }] }) }) };
            } as any;
        });
        const { searchNews } = await import('../../src/services/aiService');
        const res = await searchNews('ok');
        expect(Array.isArray(res)).toBe(true);
    });

    it('returns empty array when parsing fails', async () => {
        process.env.OPENAI_API_KEY = 'x';
        jest.doMock('openai', () => {
            return class {
                responses = { create: jest.fn().mockResolvedValue({ output_text: 'not json' }) };
            } as any;
        });
        const { searchNews } = await import('../../src/services/aiService');
        const res = await searchNews('ok');
        expect(Array.isArray(res)).toBe(true);
        expect(res.length).toBe(0);
    });

    it('maps OpenAI errors to friendly messages', async () => {
        process.env.OPENAI_API_KEY = 'x';
        jest.doMock('openai', () => {
            return class {
                responses = { create: jest.fn().mockRejectedValue({ status: 429, message: 'rate' }) };
            } as any;
        });
        const { searchNews } = await import('../../src/services/aiService');
        await expect(searchNews('ok')).rejects.toThrow('Rate limit exceeded');
    });
});
