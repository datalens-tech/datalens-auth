import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        ALTER TABLE auth_users ADD COLUMN type TEXT NOT NULL DEFAULT 'user';
        ALTER TABLE auth_users ADD COLUMN description TEXT;
        ALTER TABLE auth_users ADD COLUMN name TEXT;

        CREATE UNIQUE INDEX auth_users_uniq_name_idx ON auth_users
            USING BTREE (name);

        CREATE TABLE auth_service_account_keys (
            key_id BIGINT NOT NULL DEFAULT auth_get_id() PRIMARY KEY,
            service_account_id BIGINT NOT NULL REFERENCES auth_users (user_id) ON UPDATE CASCADE ON DELETE CASCADE,
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

        DROP INDEX auth_users_uniq_name_idx;

        ALTER TABLE auth_users DROP COLUMN name;
        ALTER TABLE auth_users DROP COLUMN description;
        ALTER TABLE auth_users DROP COLUMN type;
    `);
}
