import {AppError} from '@gravity-ui/nodekit';
import {transaction} from 'objection';

import {AUTH_ERROR} from '../../constants/error-constants';
import {UserRole} from '../../constants/role';
import {USER_TYPE} from '../../constants/user';
import {UserModel, UserModelColumn} from '../../db/models/user';
import {getPrimary, getReplica} from '../../db/utils/db';
import {insertRoles} from '../../db/utils/roles';
import {ServiceArgs} from '../../types/service';

export interface CreateServiceAccountArgs {
    name: string;
    description?: string;
    roles?: UserRole[];
}

export const createServiceAccount = async (
    {ctx, trx}: ServiceArgs,
    args: CreateServiceAccountArgs,
): Promise<UserModel> => {
    const {name, description, roles} = args;

    const registry = ctx.get('registry');
    const {getId} = registry.getDbInstance();

    ctx.log('CREATE_SERVICE_ACCOUNT', {name});

    const existing = await UserModel.query(getReplica(trx))
        .select(UserModelColumn.UserId)
        .where(UserModelColumn.Name, name)
        .first()
        .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

    if (existing) {
        throw new AppError(AUTH_ERROR.SERVICE_ACCOUNT_NAME_EXISTS, {
            code: AUTH_ERROR.SERVICE_ACCOUNT_NAME_EXISTS,
        });
    }

    const userId = await getId();

    const result = await transaction(getPrimary(trx), async (transactionTrx) => {
        const created = await UserModel.query(transactionTrx)
            .insert({
                [UserModelColumn.UserId]: userId,
                [UserModelColumn.Name]: name,
                [UserModelColumn.Description]: description,
                [UserModelColumn.Type]: USER_TYPE.SERVICE_ACCOUNT,
            })
            .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

        await insertRoles({
            trx: transactionTrx,
            userId,
            defaultRole: ctx.config.defaultRole as UserRole,
            roles,
        });

        return created;
    });

    const {createUserSuccess} = registry.common.functions.get();
    await createUserSuccess({ctx, userId});

    ctx.log('CREATE_SERVICE_ACCOUNT_SUCCESS', {serviceAccountId: userId});

    return result;
};
