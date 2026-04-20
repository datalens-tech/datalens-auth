import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE TABLE auth_service_accounts (
            service_account_id BIGINT NOT NULL DEFAULT auth_get_id() PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            public_key TEXT NOT NULL,
            roles TEXT[] NOT NULL DEFAULT '{}',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE UNIQUE INDEX auth_sa_name_idx ON auth_service_accounts USING BTREE (name);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX auth_sa_name_idx;
        DROP TABLE auth_service_accounts;
    `);
}
