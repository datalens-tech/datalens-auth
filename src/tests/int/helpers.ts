import {JwtAuth} from '../../components/jwt-auth';
import {hashPassword} from '../../components/passwords';
import {UserRole} from '../../constants/role';
import {RoleModel, RoleModelColumn} from '../../db/models/role';
import {UserModel, UserModelColumn} from '../../db/models/user';
import type {BigIntId, StringId} from '../../db/types/id';
import {registry} from '../../registry/';
import {decodeId} from '../../utils/ids';

import {appConfig, appCtx} from './auth';
import {testUserLogin, testUserPassword} from './constants';

export type CreateTestUserArgs = {
    login?: string;
    password?: string;
    roles?: `${UserRole}`[];
    email?: string;
    firstName?: string;
    lastName?: string;
};

export const createTestUsers = async ({
    login = testUserLogin,
    password = testUserPassword,
    roles,
    email,
    firstName,
    lastName,
}: CreateTestUserArgs) => {
    const {db, getId} = registry.getDbInstance();

    const hashedPassword = await hashPassword(password);

    const user = await UserModel.query(db.primary)
        .insert({
            [UserModelColumn.UserId]: await getId(),
            [UserModelColumn.Login]: login,
            [UserModelColumn.Password]: hashedPassword,
            [UserModelColumn.Email]: email,
            [UserModelColumn.FirstName]: firstName,
            [UserModelColumn.LastName]: lastName,
        })
        .returning('*')
        .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

    const resultRoles = Array.isArray(roles) ? roles : [appConfig.defaultRole].filter(Boolean);

    if (resultRoles.length) {
        await RoleModel.query(db.primary)
            .insert(
                resultRoles.map((role) => ({
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
    const {accessToken, refreshToken} = await JwtAuth.startSession(
        {ctx: appCtx},
        {userId, userIp: null},
    );
    return {accessToken, refreshToken};
};

export const isBigIntId = (value: string) => {
    try {
        return typeof BigInt(value) === 'bigint';
    } catch {}
    return false;
};
