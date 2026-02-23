import request from 'supertest';
import fs from 'fs';
import path from 'path';

const resetApp = async (mockConfig: any) => {
    jest.resetModules();
    jest.doMock('../../src/config', () => ({ config: mockConfig }));
    const app = (await import('../../src/app')).default;
    return app;
};

describe('app routes', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        jest.resetModules();
    });

    test('GET / returns JSON in non-production', async () => {
        const app = await resetApp({ nodeEnv: 'development', frontendUrl: '*', uploadDir: 'uploads', openaiApiKey: 'test' });

        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
    });

    test('GET /health returns status ok', async () => {
        const app = await resetApp({ nodeEnv: 'development', frontendUrl: '*', uploadDir: 'uploads', openaiApiKey: 'test' });

        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
    });

    test('404 returns JSON for unknown route in non-production', async () => {
        const app = await resetApp({ nodeEnv: 'development', frontendUrl: '*', uploadDir: 'uploads', openaiApiKey: 'test' });

        const res = await request(app).get('/this-does-not-exist');
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error', 'Route not found');
    });

    test('production serves frontend index.html for root and unknown routes', async () => {
        // create fake frontend build file
        const buildDir = path.join(process.cwd(), 'frontend', 'build');
        const indexPath = path.join(buildDir, 'index.html');
        fs.mkdirSync(buildDir, { recursive: true });
        fs.writeFileSync(indexPath, '<html>ok</html>');

        const app = await resetApp({ nodeEnv: 'production', frontendUrl: '*', uploadDir: 'uploads', openaiApiKey: 'test' });

        const res = await request(app).get('/');
        expect(res.status).toBe(200);

        const res2 = await request(app).get('/some/random/path');
        expect(res2.status).toBe(200);

        // cleanup
        try { fs.unlinkSync(indexPath); fs.rmdirSync(buildDir, { recursive: true }); } catch (e) { }
    });
});
