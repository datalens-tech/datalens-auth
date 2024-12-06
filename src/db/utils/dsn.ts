import fs from 'node:fs';

export function getDsnList() {
    let dsnList;
    const pgRdsConfigPath = process.env.POSTGRES_RDS_CONFIG_PATH;

    if (pgRdsConfigPath) {
        const pgRdsConfig = JSON.parse(fs.readFileSync(pgRdsConfigPath).toString());
        const pgHost = pgRdsConfig.host;
        const pgPort = pgRdsConfig.port;
        const pgDb = pgRdsConfig.dbname;
        const pgPassword = pgRdsConfig.password;
        const pgUsername = pgRdsConfig.username;
        dsnList = `postgres://${pgUsername}:${pgPassword}@${pgHost}:${pgPort}/${pgDb}?ssl=true`;
    } else if (
        process.env.POSTGRES_HOSTS &&
        process.env.POSTGRES_PORT &&
        process.env.POSTGRES_USER_PASSWD &&
        process.env.POSTGRES_USER_NAME &&
        process.env.POSTGRES_DB_NAME
    ) {
        dsnList = process.env.POSTGRES_HOSTS.split(',')
            .map((host) => {
                return `postgres://${process.env.POSTGRES_USER_NAME}:${
                    process.env.POSTGRES_USER_PASSWD
                }@${host}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB_NAME}${
                    process.env.POSTGRES_DISABLE_SSL ? '' : '?ssl=true'
                }`;
            })
            .join(',');
    } else {
        dsnList = process.env.POSTGRES_DSN_LIST;
    }

    if (!dsnList) {
        throw new Error('Missing POSTGRES_DSN_LIST in env');
    }

    return dsnList;
}

export const testDbConfig = {
    user: 'test',
    password: 'test',
    dbName: 'int-testing_us_ci_purgeable',
};

export const getTestDsnList = () => {
    const globals = global as unknown as {
        __TESTCONTAINERS_POSTGRE_IP__: string;
        __TESTCONTAINERS_POSTGRE_PORT_5432__: string;
    };
    return `postgres://${testDbConfig.user}:${testDbConfig.password}@${globals.__TESTCONTAINERS_POSTGRE_IP__}:${globals.__TESTCONTAINERS_POSTGRE_PORT_5432__}/${testDbConfig.dbName}`;
};
