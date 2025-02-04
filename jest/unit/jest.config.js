const config = {
    rootDir: '../../',
    testMatch: [
        '**/dist/server/**/(*.)+(test|spec).js',
        '!**/dist/server/tests/**/(*.)+(test|spec).js',
    ],
    passWithNoTests: true,
    setupFilesAfterEnv: ['jest-extended/all'],
};

module.exports = config;
