import { cosineSimilarity } from '../../src/services/embeddingService';

describe('Embedding Service - cosineSimilarity', () => {
    it('computes similarity for identical vectors', () => {
        const a = [1, 0, 0];
        const b = [1, 0, 0];
        const sim = cosineSimilarity(a, b);
        expect(sim).toBeCloseTo(1);
    });

    it('returns 0 if a vector has zero norm', () => {
        const a = [0, 0, 0];
        const b = [1, 2, 3];
        const sim = cosineSimilarity(a, b);
        expect(sim).toBe(0);
    });

    it('throws when vectors have different lengths', () => {
        expect(() => cosineSimilarity([1, 2], [1])).toThrow('Vectors must have the same length');
    });
});
