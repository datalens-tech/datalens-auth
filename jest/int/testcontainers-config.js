const {testDbConfig} = require('../../dist/server/db/utils/dsn');

module.exports = {
    postgre: {
        name: 'postgres-test',
        image: 'postgres',
        tag: '11',
        ports: [5432],
        env: {
            POSTGRES_USER: testDbConfig.user,
            POSTGRES_PASSWORD: testDbConfig.password,
            POSTGRES_DB: testDbConfig.dbName,
        },
        wait: {
            type: 'ports',
            timeout: 50000,
        },
    },
};
