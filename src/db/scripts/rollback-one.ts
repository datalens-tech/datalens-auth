import dotenv from 'dotenv';
dotenv.config();

import '../../index';
import {registry} from '../../registry';

if (require.main === module) {
    const {helpers} = registry.getDbInstance();
    helpers
        .rollbackDatabase({onlyOne: true})
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
