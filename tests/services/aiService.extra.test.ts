describe('AI Service additional branches', () => {
    beforeEach(() => jest.resetModules());

    it('handles response in `output` key', async () => {
        process.env.OPENAI_API_KEY = 'x';
        const longTitle = 'A'.repeat(300);
        jest.doMock('openai', () => {
            return class {
                responses = { create: jest.fn().mockResolvedValue({ output: JSON.stringify({ articles: [{ title: longTitle, summary: 's', relevance: 'r', category: 'World' }] }) }) };
            } as any;
        });
        const { searchNews } = await import('../../src/services/aiService');
        const res = await searchNews('search term');
        expect(res[0].title.length).toBeLessThanOrEqual(203); // truncated + '...'
    });

    it('maps 401 to invalid API key message', async () => {
        process.env.OPENAI_API_KEY = 'x';
        jest.doMock('openai', () => {
            return class { responses = { create: jest.fn().mockRejectedValue({ status: 401, message: 'bad' }) } } as any;
        });
        const { searchNews } = await import('../../src/services/aiService');
        await expect(searchNews('search term')).rejects.toThrow('Invalid API key');
    });

    it('maps model errors to friendly message', async () => {
        process.env.OPENAI_API_KEY = 'x';
        jest.doMock('openai', () => {
            return class { responses = { create: jest.fn().mockRejectedValue(new Error('model not found')) } } as any;
        });
        const { searchNews } = await import('../../src/services/aiService');
        await expect(searchNews('search term')).rejects.toThrow('Model not available');
    });
});
