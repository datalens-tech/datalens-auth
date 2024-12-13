const config = {
    rootDir: '../../',
    testMatch: [
        '**/dist/server/**/(*.)+(test|spec).js',
        '!**/dist/server/tests/**/(*.)+(test|spec).js',
    ],
    passWithNoTests: true,
};

module.exports = config;
