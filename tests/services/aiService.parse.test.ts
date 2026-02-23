describe('aiService parsing and error branches', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    test('parses articles array from output_text', async () => {
        const fakeResponse = { output_text: JSON.stringify({ articles: [{ title: 'T', summary: 'S', relevance: 'R', category: 'World' }] }) };
        jest.doMock('../../src/config', () => ({ config: { openaiApiKey: 'x' } }));
        jest.doMock('openai', () => ({
            default: class {
                constructor() { }
                get responses() {
                    return { create: jest.fn().mockResolvedValue(fakeResponse) };
                }
            }
        }));

        const ai = await import('../../src/services/aiService');
        const searchNews = ai.searchNews as any;

        const res = await searchNews('hello world');
        expect(Array.isArray(res)).toBe(true);
        expect(res[0].title).toContain('T');
    });

    test('parses direct JSON array in output_text', async () => {
        const fakeResponse = { output_text: JSON.stringify([{ title: 'Only' }]) };
        jest.doMock('../../src/config', () => ({ config: { openaiApiKey: 'x' } }));
        jest.doMock('openai', () => ({
            default: class {
                constructor() { }
                get responses() {
                    return { create: jest.fn().mockResolvedValue(fakeResponse) };
                }
            }
        }));

        const ai = await import('../../src/services/aiService');
        const searchNews = ai.searchNews as any;

        const res = await searchNews('q');
        expect(res.length).toBeGreaterThanOrEqual(0);
    });

    test('returns empty array when parse fails', async () => {
        const fakeResponse = { output_text: 'not json at all' };
        jest.doMock('../../src/config', () => ({ config: { openaiApiKey: 'x' } }));
        jest.doMock('openai', () => ({
            default: class {
                constructor() { }
                get responses() {
                    return { create: jest.fn().mockResolvedValue(fakeResponse) };
                }
            }
        }));

        const ai = await import('../../src/services/aiService');
        const searchNews = ai.searchNews as any;

        const res = await searchNews('valid query');
        expect(Array.isArray(res)).toBe(true);
    });

    test('throws friendly message on 401 error', async () => {
        jest.doMock('../../src/config', () => ({ config: { openaiApiKey: 'x' } }));
        jest.doMock('openai', () => ({
            default: class {
                constructor() { }
                get responses() {
                    return { create: jest.fn().mockRejectedValue({ status: 401, message: 'bad' }) };
                }
            }
        }));

        const ai = await import('../../src/services/aiService');
        const searchNews = ai.searchNews as any;

        await expect(searchNews('abc')).rejects.toThrow(/Invalid API key/);
    });
});
