import dotenv from 'dotenv';
dotenv.config();

import '../../index';
import {registry} from '../../registry';

async function createExtensions() {
    const {db} = registry.getDbInstance();
    try {
        await db.ready();

        await db.primary.raw(`
            CREATE EXTENSION IF NOT EXISTS pg_trgm;
            CREATE EXTENSION IF NOT EXISTS btree_gin;
            CREATE EXTENSION IF NOT EXISTS btree_gist;
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        `);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

if (require.main === module) {
    createExtensions();
}
