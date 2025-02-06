import dotenv from 'dotenv';
dotenv.config();

import '../../../index';
import {registry} from '../../../registry';
import {createExtensions} from '../../utils/create-extensions';

if (require.main === module) {
    const {db} = registry.getDbInstance();

    (async function () {
        try {
            await db.ready();

            await createExtensions(db.primary);

            process.exit(0);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    })();
}
