// Test AI service functions with mocked OpenAI client
describe('AI Service', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    it('searchNews parses response with articles array', async () => {
        process.env.OPENAI_API_KEY = 'test';
        jest.doMock('openai', () => {
            return class {
                responses = {
                    create: jest.fn().mockResolvedValue({ output_text: JSON.stringify({ articles: [{ title: 'T', summary: 'S', relevance: 'R', category: 'World', url: 'u' }] }) }),
                };
            } as any;
        });

        const { searchNews } = await import('../../src/services/aiService');
        const res = await searchNews('hello world');
        expect(Array.isArray(res)).toBe(true);
        expect(res[0].title).toBeDefined();
    });

    it('analyzeContent returns message content', async () => {
        process.env.OPENAI_API_KEY = 'test';
        jest.doMock('openai', () => {
            return class {
                chat = { completions: { create: jest.fn().mockResolvedValue({ choices: [{ message: { content: 'analysis' } }] }) } };
            } as any;
        });

        const { analyzeContent } = await import('../../src/services/aiService');
        const out = await analyzeContent('some content');
        expect(out).toBe('analysis');
    });

    it('generateContentSuggestions parses json suggestions', async () => {
        process.env.OPENAI_API_KEY = 'test';
        jest.doMock('openai', () => {
            return class {
                chat = { completions: { create: jest.fn().mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ suggestions: ['a', 'b'] }) } }] }) } };
            } as any;
        });

        const { generateContentSuggestions } = await import('../../src/services/aiService');
        const list = await generateContentSuggestions('topic');
        expect(list).toEqual(expect.arrayContaining(['a', 'b']));
    });
});
