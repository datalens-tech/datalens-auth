const knexBuilder = require('knex');
const _ = require('lodash');

const {getKnexOptions} = require('../../dist/server/db/init-db');
const {getTestDsnList} = require('../../dist/server/db/utils/dsn');
const {tableExists, truncateTables} = require('../../dist/server/tests/int/utils');

const prepareTestDb = async () => {
    const knexOptions = _.merge({}, getKnexOptions(), {
        connection: getTestDsnList(),
    });

    const knexInstance = knexBuilder(knexOptions);

    const exists = await tableExists(knexInstance, 'auth_migrations');

    if (exists) {
        await truncateTables(knexInstance, {
            exclude: ['auth_migrations', 'auth_migrations_lock'],
        });
    } else {
        await knexInstance.raw(`
            CREATE EXTENSION IF NOT EXISTS pg_trgm;
        `);
    }

    await knexInstance.migrate.latest();
    await knexInstance.destroy();
};

module.exports = {prepareTestDb};
