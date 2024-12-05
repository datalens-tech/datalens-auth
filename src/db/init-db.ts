import * as path from 'node:path';

import type {NodeKit} from '@gravity-ui/nodekit';
import {getModel, initDB as initPosgresDB} from '@gravity-ui/postgreskit';
import type {Knex} from 'knex';

import {AppEnv} from '../constants/app';
import {DEFAULT_DB_QUERY_TIMEOUT} from '../constants/timeout';
import {isTrueArg} from '../utils/env-utils';

import {getDsnList, getTestDsnList} from './utils/dsn';
import {camelCase} from './utils/utils';

interface OrigImplFunction {
    (snakeCaseFormat: string): string;
}

export class Model extends getModel() {
    static DEFAULT_QUERY_TIMEOUT = DEFAULT_DB_QUERY_TIMEOUT;
}

function convertCamelCase(dataObj = {}) {
    return Object.entries(dataObj).reduce((dataObjFormed: {[key: string]: unknown}, objEntry) => {
        const [property, value] = objEntry;
        const propertyCamelCase = camelCase(property);
        dataObjFormed[propertyCamelCase] = value;
        return dataObjFormed;
    }, {});
}

export const getKnexOptions = () =>
    ({
        client: 'pg',
        pool: {
            min: 0,
            max: 15,
            acquireTimeoutMillis: 40000,
            createTimeoutMillis: 50000,
            idleTimeoutMillis: 45000,
            reapIntervalMillis: 1000,
        },
        acquireConnectionTimeout: 10000,
        migrations: {
            directory: path.resolve(__dirname, 'migrations'),
            tableName: 'auth_migrations',
            extension: 'js',
            loadExtensions: ['.js'],
        },
        postProcessResponse: (result) => {
            let dataFormed;

            if (Array.isArray(result)) {
                dataFormed = result.map((dataObj) => convertCamelCase(dataObj));
            } else if (result !== null && typeof result === 'object') {
                dataFormed = convertCamelCase(result);
            } else {
                dataFormed = result;
            }

            return dataFormed;
        },
        wrapIdentifier: (value: string, origImpl: OrigImplFunction): string => {
            const snakeCaseFormat = value.replace(/(?=[A-Z])/g, '_').toLowerCase();

            return origImpl(snakeCaseFormat);
        },
        debug: isTrueArg(process.env.SQL_DEBUG),
    }) satisfies Knex.Config;

export function initDB(nodekit: NodeKit) {
    let dsnList: string;
    if (nodekit.config.appEnv === AppEnv.IntTesting) {
        dsnList = getTestDsnList();
    } else {
        dsnList = getDsnList();
    }

    const suppressStatusLogs = isTrueArg(process.env.US_SURPRESS_DB_STATUS_LOGS);

    const dispatcherOptions = {
        healthcheckInterval: 5000,
        healthcheckTimeout: 2000,
        suppressStatusLogs,
    };

    const {db, helpers} = initPosgresDB({
        connectionString: dsnList,
        dispatcherOptions,
        knexOptions: getKnexOptions(),
        logger: {
            info: (...args) => nodekit.ctx.log(...args),
            error: (...args) => nodekit.ctx.logError(...args),
        },
    });

    async function getId() {
        const queryResult = await db.primary.raw('select get_id() as id');
        return queryResult.rows[0].id;
    }

    Model.db = db;

    return {db, Model, getId, helpers};
}
