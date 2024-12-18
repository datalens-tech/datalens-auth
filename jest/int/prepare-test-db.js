const knexBuilder = require('knex');
const _ = require('lodash');

const {getKnexOptions} = require('../../dist/server/db/init-db');
const {getTestDsnList} = require('../../dist/server/db/utils/dsn');

const prepareTestDb = async () => {
    const knexOptions = _.merge({}, getKnexOptions(), {
        connection: getTestDsnList(),
    });

    const knexInstance = knexBuilder(knexOptions);

    await knexInstance.raw(`
        DROP SCHEMA public CASCADE;
        CREATE SCHEMA public;
    `);

    await knexInstance.migrate.latest();
    await knexInstance.destroy();
};

module.exports = {prepareTestDb};
