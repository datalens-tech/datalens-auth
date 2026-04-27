import {AppError} from '@gravity-ui/nodekit';
import {transaction} from 'objection';

import {hashPassword} from '../../components/passwords';
import {AUTH_ERROR} from '../../constants/error-constants';
import {UserRole} from '../../constants/role';
import {USER_TYPE} from '../../constants/user';
import {UserModel, UserModelColumn} from '../../db/models/user';
import {getPrimary, getReplica} from '../../db/utils/db';
import {lowerEqual} from '../../db/utils/query';
import {insertRoles} from '../../db/utils/roles';
import {ServiceArgs} from '../../types/service';
import {Optional} from '../../utils/utility-types';

export interface CreateUserArgs {
    login: string;
    password: string;
    email: Optional<string>;
    firstName: Optional<string>;
    lastName: Optional<string>;
    roles: Optional<UserRole[]>;
}

export const createUser = async ({ctx, trx}: ServiceArgs, args: CreateUserArgs) => {
    const {login, firstName, lastName, email, password, roles} = args;

    const registry = ctx.get('registry');
    const {getId} = registry.getDbInstance();

    ctx.log('CREATE_USER');

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
        const createdUser = await UserModel.query(transactionTrx)
            .insert({
                [UserModelColumn.UserId]: userId,
                [UserModelColumn.Login]: login,
                [UserModelColumn.Password]: hashedPassword,
                [UserModelColumn.Email]: email,
                [UserModelColumn.FirstName]: firstName,
                [UserModelColumn.LastName]: lastName,
                [UserModelColumn.Type]: USER_TYPE.USER,
            })
            .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

        await insertRoles(transactionTrx, userId, roles, ctx.config.defaultRole as UserRole);

        return createdUser;
    });

    const {createUserSuccess} = registry.common.functions.get();
    await createUserSuccess({ctx, userId});

    ctx.log('CREATE_USER_SUCCESS', {userId});

    return result;
};
