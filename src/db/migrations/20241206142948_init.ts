import type {Knex} from 'knex';

export async function up(knex: Knex): Promise<void> {
    return knex.raw(`
        CREATE SEQUENCE auth_counter_seq;

        CREATE OR REPLACE FUNCTION get_id(OUT result bigint) AS $$
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
    `);
}

export async function down(knex: Knex): Promise<void> {
    return knex.raw(`
        DROP SEQUENCE auth_counter_seq;
    `);
}
