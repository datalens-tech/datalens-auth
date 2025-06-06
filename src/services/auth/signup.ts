import {AppError} from '@gravity-ui/nodekit';
import {transaction} from 'objection';

import {JwtAuth} from '../../components/jwt-auth';
import {hashPassword} from '../../components/passwords';
import {AUTH_ERROR} from '../../constants/error-constants';
import {RoleModel, RoleModelColumn} from '../../db/models/role';
import {UserModel, UserModelColumn} from '../../db/models/user';
import {getPrimary, getReplica} from '../../db/utils/db';
import {lowerEqual} from '../../db/utils/query';
import {ServiceArgs} from '../../types/service';
import {Nullable, Optional} from '../../utils/utility-types';

export interface SignupArgs {
    login: string;
    password: string;
    email: Optional<string>;
    firstName: Optional<string>;
    lastName: Optional<string>;
    userAgent: Optional<string>;
    userIp: Nullable<string>;
}

export const signup = async ({ctx, trx}: ServiceArgs, args: SignupArgs) => {
    const {login, firstName, lastName, email, password, userAgent, userIp} = args;

    const registry = ctx.get('registry');
    const {getId} = registry.getDbInstance();

    ctx.log('SIGNUP');

    const user = await UserModel.query(getReplica(trx))
        .select(UserModelColumn.UserId)
        .where(UserModelColumn.IdpType, null)
        .where(lowerEqual({column: UserModelColumn.Login, value: login}))
        .first()
        .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

    if (user) {
        throw new AppError(AUTH_ERROR.USER_ALREADY_EXISTS, {code: AUTH_ERROR.USER_ALREADY_EXISTS});
    }

    const hashedPassword = await hashPassword(password);

    const userId = await getId();

    const result = await transaction(getPrimary(trx), async (transactionTrx) => {
        await UserModel.query(transactionTrx)
            .insert({
                [UserModelColumn.UserId]: userId,
                [UserModelColumn.Login]: login,
                [UserModelColumn.Password]: hashedPassword,
                [UserModelColumn.Email]: email,
                [UserModelColumn.FirstName]: firstName,
                [UserModelColumn.LastName]: lastName,
            })
            .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

        const roles = [ctx.config.defaultRole].filter(Boolean);
        if (roles.length) {
            await RoleModel.query(transactionTrx)
                .insert(
                    roles.map((role) => ({
                        [RoleModelColumn.UserId]: userId,
                        [RoleModelColumn.Role]: role,
                    })),
                )
                .timeout(RoleModel.DEFAULT_QUERY_TIMEOUT);
        }

        const {accessToken, refreshToken} = await JwtAuth.startSession(
            {ctx, trx: transactionTrx},
            {
                userId,
                userAgent,
                userIp,
            },
        );

        return {accessToken, refreshToken};
    });

    const {signinSuccess} = registry.common.functions.get();
    await signinSuccess({
        ctx,
        userId,
    });

    ctx.log('SIGNUP_SUCCESS');

    return result;
};
