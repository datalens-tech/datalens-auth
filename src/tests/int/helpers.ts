import {JwtAuth} from '../../components/jwt-auth';
import {hashPassword} from '../../components/passwords';
import {UserRole} from '../../constants/role';
import {RoleModel, RoleModelColumn} from '../../db/models/role';
import {UserModel, UserModelColumn} from '../../db/models/user';
import type {BigIntId, StringId} from '../../db/types/id';
import {registry} from '../../registry/';
import {decodeId} from '../../utils/ids';

import {appCtx} from './auth';
import {testUserLogin, testUserPassword} from './constants';

type CreateTestUserArgs = {
    login?: string;
    password?: string;
    roles?: `${UserRole}`[];
};

export const createTestUsers = async ({
    login = testUserLogin,
    password = testUserPassword,
    roles,
}: CreateTestUserArgs) => {
    const {db, getId} = registry.getDbInstance();

    const hashedPassword = await hashPassword(password);

    const user = await UserModel.query(db.primary)
        .insert({
            [UserModelColumn.UserId]: await getId(),
            [UserModelColumn.Login]: login,
            [UserModelColumn.Password]: hashedPassword,
        })
        .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

    if (roles) {
        await RoleModel.query(db.primary)
            .insert(
                roles.map((role) => ({
                    [RoleModelColumn.UserId]: user[UserModelColumn.UserId],
                    [RoleModelColumn.Role]: role,
                })),
            )
            .timeout(RoleModel.DEFAULT_QUERY_TIMEOUT);
    }

    return user;
};

type GenerateTokensArgs =
    | {
          userId: BigIntId;
      }
    | {userStringId: StringId};

export const generateTokens = async (args: GenerateTokensArgs) => {
    const userId = 'userId' in args ? args.userId : decodeId(args.userStringId);
    return await JwtAuth.startSession({ctx: appCtx}, {userId, userIp: null});
};

export const isBigIntId = (value: string) => {
    try {
        return typeof BigInt(value) === 'bigint';
    } catch {}
    return false;
};
