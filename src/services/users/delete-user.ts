import {AppError} from '@gravity-ui/nodekit';

import {AUTH_ERROR} from '../../constants/error-constants';
import {UserModel, UserModelColumn} from '../../db/models/user';
import type {BigIntId} from '../../db/types/id';
import {getPrimary, getReplica} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';

export interface DeleteUserArgs {
    userId: BigIntId;
}

export const deleteUser = async ({ctx, trx}: ServiceArgs, args: DeleteUserArgs) => {
    const {userId} = args;
    const {isPrivateRoute} = ctx.get('info');

    ctx.log('DELETE_USER', {userId});

    const user = await UserModel.query(getReplica(trx))
        .select([UserModelColumn.IdpSlug])
        .where(UserModelColumn.UserId, userId)
        .first()
        .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

    if (!user) {
        throw new AppError(AUTH_ERROR.USER_NOT_EXISTS, {code: AUTH_ERROR.USER_NOT_EXISTS});
    }

    if (!isPrivateRoute && user[UserModelColumn.IdpSlug] !== null) {
        throw new AppError(AUTH_ERROR.IDP_USER_CHANGE_NOT_ALLOWED, {
            code: AUTH_ERROR.IDP_USER_CHANGE_NOT_ALLOWED,
        });
    }

    await UserModel.query(getPrimary(trx))
        .delete()
        .where(UserModelColumn.UserId, userId)
        .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

    ctx.log('DELETE_USER_SUCCESS', {userId});
};
