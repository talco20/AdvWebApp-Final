describe('passport config', () => {
    afterEach(() => {
        jest.resetModules();
        jest.restoreAllMocks();
    });

    test('does not register google strategy when config missing', async () => {
        jest.doMock('../../src/config', () => ({ config: { googleClientId: '', googleClientSecret: '' } }));
        const passport = (await import('../../src/config/passport')).default as any;
        expect(passport._strategy('google')).toBeUndefined();
    });

    test('registers google strategy when config present', async () => {
        jest.doMock('../../src/config', () => ({ config: { googleClientId: 'cid', googleClientSecret: 'csecret', googleCallbackUrl: '/cb' } }));
        const passport = (await import('../../src/config/passport')).default as any;
        const strat = passport._strategy('google');
        expect(strat).toBeDefined();

        // Invoke the verify callback to exercise its code path
        if (strat && typeof strat._verify === 'function') {
            await new Promise<void>((resolve) => {
                strat._verify('at', 'rt', { id: 'pid', emails: [{ value: 'e@x.com' }], displayName: 'D', photos: [{ value: 'p' }] }, (err: any, user: any) => {
                    expect(err).toBeNull();
                    expect(user).toBeDefined();
                    resolve();
                });
            });
        }
    });
});
