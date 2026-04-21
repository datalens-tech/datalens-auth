import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE TABLE auth_service_accounts (
            service_account_id BIGINT NOT NULL DEFAULT auth_get_id() PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            roles TEXT[] NOT NULL DEFAULT '{}',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE auth_service_account_keys (
            key_id BIGINT NOT NULL DEFAULT auth_get_id() PRIMARY KEY,
            service_account_id BIGINT NOT NULL REFERENCES auth_service_accounts (service_account_id) ON UPDATE CASCADE ON DELETE CASCADE,
            public_key TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX auth_sa_keys_sa_id_idx ON auth_service_account_keys USING BTREE (service_account_id);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX auth_sa_keys_sa_id_idx;
        DROP TABLE auth_service_account_keys;

        DROP TABLE auth_service_accounts;
    `);
}
