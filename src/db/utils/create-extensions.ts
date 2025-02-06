import type {Knex} from 'knex';

export async function createExtensions(knex: Knex) {
    await knex.raw(`
        CREATE EXTENSION IF NOT EXISTS pg_trgm;
    `);
}
