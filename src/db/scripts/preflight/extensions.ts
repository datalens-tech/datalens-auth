import dotenv from 'dotenv';
dotenv.config();

import '../../../index';
import {registry} from '../../../registry';

if (require.main === module) {
    const {db} = registry.getDbInstance();

    (async function () {
        try {
            await db.ready();

            await db.primary.raw(`
                CREATE EXTENSION IF NOT EXISTS pg_trgm;
            `);

            process.exit(0);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    })();
}
