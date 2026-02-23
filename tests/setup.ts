// Test setup: configure environment and common mocks
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// Silence console during tests except errors
const originalConsole = global.console;
beforeAll(() => {
    // keep error logging
    global.console = {
        ...originalConsole,
        info: () => { },
        log: () => { },
        warn: () => { },
    } as Console;
});

afterAll(() => {
    global.console = originalConsole;
});
