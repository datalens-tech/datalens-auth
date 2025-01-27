import dotenv from 'dotenv';
dotenv.config();

import '../../../index';
import {registry} from '../../../registry';
import {hashPassword} from '../../../components/passwords';
import {UserRole} from '../../../constants/role';
import {UserModel, UserModelColumn} from '../../models/user';
import {RoleModel, RoleModelColumn} from '../../models/role';

if (require.main === module) {
    const {db, getId} = registry.getDbInstance();
    (async function () {
        try {
            await db.ready();

            const result = await db.primary.raw(`SELECT COUNT(*) AS count FROM auth_users;`);

            if (result?.rows?.[0]?.count === '0') {
                const hashedPassword = await hashPassword(process.env.AUTH_ADMIN_PASSWORD!);

                const user = await UserModel.query(db.primary)
                    .insert({
                        [UserModelColumn.UserId]: await getId(),
                        [UserModelColumn.Login]: 'admin',
                        [UserModelColumn.Password]: hashedPassword,
                        [UserModelColumn.FirstName]: 'Admin',
                    })
                    .returning(UserModelColumn.UserId)
                    .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

                await RoleModel.query(db.primary)
                    .insert({
                        [RoleModelColumn.UserId]: user[UserModelColumn.UserId],
                        [RoleModelColumn.Role]: UserRole.Admin,
                    })
                    .timeout(RoleModel.DEFAULT_QUERY_TIMEOUT);
            }

            process.exit(0);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    })();
}
