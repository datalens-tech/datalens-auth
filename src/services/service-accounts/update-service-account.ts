import {AppError} from '@gravity-ui/nodekit';

import {AUTH_ERROR} from '../../constants/error-constants';
import {USER_TYPE} from '../../constants/user';
import {UserModel, UserModelColumn} from '../../db/models/user';
import type {BigIntId} from '../../db/types/id';
import {getPrimary, getReplica} from '../../db/utils/db';
import {setCurrentTime} from '../../db/utils/query';
import {ServiceArgs} from '../../types/service';

export interface UpdateServiceAccountArgs {
    serviceAccountId: BigIntId;
    name: string;
}

export const updateServiceAccount = async (
    {ctx, trx}: ServiceArgs,
    args: UpdateServiceAccountArgs,
): Promise<void> => {
    const {serviceAccountId, name} = args;

    ctx.log('UPDATE_SERVICE_ACCOUNT', {serviceAccountId});

    const sa = await UserModel.query(getReplica(trx))
        .select([UserModelColumn.UserId])
        .where(UserModelColumn.UserId, serviceAccountId)
        .where(UserModelColumn.Type, USER_TYPE.SERVICE_ACCOUNT)
        .first()
        .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

    if (!sa) {
        throw new AppError(AUTH_ERROR.SERVICE_ACCOUNT_NOT_EXISTS, {
            code: AUTH_ERROR.SERVICE_ACCOUNT_NOT_EXISTS,
        });
    }

    const nameConflict = await UserModel.query(getReplica(trx))
        .select(UserModelColumn.UserId)
        .where(UserModelColumn.Name, name)
        .first()
        .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

    if (nameConflict) {
        throw new AppError(AUTH_ERROR.SERVICE_ACCOUNT_NAME_EXISTS, {
            code: AUTH_ERROR.SERVICE_ACCOUNT_NAME_EXISTS,
        });
    }

    await UserModel.query(getPrimary(trx))
        .patch({
            [UserModelColumn.Name]: name,
            [UserModelColumn.UpdatedAt]: setCurrentTime(),
        })
        .where(UserModelColumn.UserId, serviceAccountId)
        .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

    ctx.log('UPDATE_SERVICE_ACCOUNT_SUCCESS', {serviceAccountId});
};
