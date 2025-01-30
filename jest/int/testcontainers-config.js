const {testDbConfig} = require('../../dist/server/db/utils/dsn');

module.exports = {
    postgre: {
        name: 'postgres-test',
        image: 'postgres',
        tag: '16',
        ports: [5432],
        env: {
            POSTGRES_USER: testDbConfig.user,
            POSTGRES_PASSWORD: testDbConfig.password,
            POSTGRES_DB: testDbConfig.dbName,
            POSTGRES_INITDB_ARGS: '--encoding=UTF-8 --lc-collate=en_US.utf8 --lc-ctype=en_US.utf8',
        },
        wait: {
            type: 'ports',
            timeout: 50000,
        },
    },
};
