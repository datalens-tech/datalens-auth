import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE SEQUENCE auth_counter_seq;

        CREATE FUNCTION auth_get_id(OUT result bigint) AS $$
        DECLARE
            our_epoch bigint := 1514754000000;
            seq_id bigint;
            now_millis bigint;
            shard_id int := 1;
        BEGIN
            SELECT nextval('auth_counter_seq') % 4096 INTO seq_id;

            SELECT FLOOR(EXTRACT(EPOCH FROM clock_timestamp()) * 1000) INTO now_millis;
            result := (now_millis - our_epoch) << 23;
            result := result | (shard_id << 10);
            result := result | (seq_id);
        END;
        $$ LANGUAGE PLPGSQL;

        CREATE TABLE auth_users (
            user_id BIGINT NOT NULL DEFAULT auth_get_id() PRIMARY KEY,
            login TEXT,
            password TEXT,
            first_name TEXT,
            last_name TEXT,
            email TEXT,
            idp_user_id TEXT,
            idp_slug TEXT,
            idp_type TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX auth_users_login_idx ON auth_users USING BTREE (login);
        CREATE INDEX auth_users_idp_type_idx ON auth_users USING BTREE (idp_type);
        CREATE UNIQUE INDEX auth_users_uniq_idp_user_slug_idx on auth_users USING BTREE (idp_user_id, idp_slug);
        CREATE UNIQUE INDEX auth_users_uniq_local_login_idx ON auth_users USING BTREE (LOWER(login)) WHERE idp_slug IS NULL;

        CREATE INDEX auth_users_login_lower_idx ON auth_users (LOWER(login));
        CREATE INDEX auth_users_first_name_lower_idx ON auth_users (LOWER(first_name));
        CREATE INDEX auth_users_last_name_lower_idx ON auth_users (LOWER(last_name));
        CREATE INDEX auth_users_email_lower_idx ON auth_users (LOWER(email));

        CREATE INDEX auth_users_login_trgm_idx ON auth_users USING gin (LOWER(login) gin_trgm_ops);
        CREATE INDEX auth_users_first_name_trgm_idx ON auth_users USING gin (LOWER(first_name) gin_trgm_ops);
        CREATE INDEX auth_users_last_name_trgm_idx ON auth_users USING gin (LOWER(last_name) gin_trgm_ops);
        CREATE INDEX auth_users_email_trgm_idx ON auth_users USING gin (LOWER(email) gin_trgm_ops);

        CREATE TABLE auth_sessions (
            session_id BIGINT NOT NULL DEFAULT auth_get_id() PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES auth_users (user_id) ON UPDATE CASCADE ON DELETE CASCADE,
            user_agent TEXT NOT NULL,
            user_ip TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expired_at TIMESTAMPTZ NOT NULL
        );

        CREATE INDEX auth_sessions_user_id_idx ON auth_sessions USING BTREE (user_id);

        CREATE TABLE auth_refresh_tokens (
            refresh_token_id BIGINT NOT NULL DEFAULT auth_get_id() PRIMARY KEY,
            session_id BIGINT NOT NULL REFERENCES auth_sessions (session_id) ON UPDATE CASCADE ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expired_at TIMESTAMPTZ NOT NULL
        );

        CREATE UNIQUE INDEX auth_refresh_tokens_session_id_idx ON auth_refresh_tokens USING BTREE (session_id);

        CREATE TABLE auth_roles (
            role_id BIGINT NOT NULL DEFAULT auth_get_id() PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES auth_users (user_id) ON UPDATE CASCADE ON DELETE CASCADE,
            role TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX auth_roles_user_id_idx ON auth_roles USING BTREE (user_id);
        CREATE INDEX auth_roles_role_idx ON auth_roles USING BTREE (role);
        CREATE UNIQUE INDEX auth_roles_uniq_user_role_idx on auth_roles USING BTREE (user_id, role);
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP INDEX auth_roles_uniq_user_role_idx;
        DROP INDEX auth_roles_role_idx;
        DROP INDEX auth_roles_user_id_idx;
        DROP TABLE auth_roles;

        DROP INDEX auth_refresh_tokens_session_id_idx;
        DROP TABLE auth_refresh_tokens;

        DROP INDEX auth_sessions_user_id_idx;
        DROP TABLE auth_sessions;

        DROP INDEX auth_users_email_trgm_idx;
        DROP INDEX auth_users_last_name_trgm_idx;
        DROP INDEX auth_users_first_name_trgm_idx;
        DROP INDEX auth_users_login_trgm_idx;
        DROP INDEX auth_users_email_lower_idx;
        DROP INDEX auth_users_last_name_lower_idx;
        DROP INDEX auth_users_first_name_lower_idx;
        DROP INDEX auth_users_login_lower_idx;
        DROP INDEX auth_users_uniq_local_login_idx;
        DROP INDEX auth_users_uniq_idp_user_slug_idx;
        DROP INDEX auth_users_idp_type_idx;
        DROP INDEX auth_users_login_idx;
        DROP TABLE auth_users;

        DROP FUNCTION auth_get_id();
        DROP SEQUENCE auth_counter_seq;
    `);
}
