import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE INDEX auth_users_login_lower_idx ON auth_users (LOWER(login));
        CREATE INDEX auth_users_first_name_lower_idx ON auth_users (LOWER(first_name));
        CREATE INDEX auth_users_last_name_lower_idx ON auth_users (LOWER(last_name));
        CREATE INDEX auth_users_email_lower_idx ON auth_users (LOWER(email));

        CREATE INDEX auth_users_login_trgm_idx ON auth_users USING gin (LOWER(login) gin_trgm_ops);
        CREATE INDEX auth_users_first_name_trgm_idx ON auth_users USING gin (LOWER(first_name) gin_trgm_ops);
        CREATE INDEX auth_users_last_name_trgm_idx ON auth_users USING gin (LOWER(last_name) gin_trgm_ops);
        CREATE INDEX auth_users_email_trgm_idx ON auth_users USING gin (LOWER(email) gin_trgm_ops);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX auth_users_email_trgm_idx;
        DROP INDEX auth_users_last_name_trgm_idx;
        DROP INDEX auth_users_first_name_trgm_idx;
        DROP INDEX auth_users_login_trgm_idx;

        DROP INDEX auth_users_email_lower_idx;
        DROP INDEX auth_users_last_name_lower_idx;
        DROP INDEX auth_users_first_name_lower_idx;
        DROP INDEX auth_users_login_lower_idx;
    `);
}
