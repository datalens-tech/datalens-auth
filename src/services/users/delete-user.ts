import {UserModel, UserModelColumn} from '../../db/models/user';
import type {BigIntId} from '../../db/types/id';
import {getPrimary} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';

export interface DeleteUserArgs {
    userId: BigIntId;
}

export const deleteUser = async ({ctx, trx}: ServiceArgs, args: DeleteUserArgs) => {
    const {userId} = args;

    ctx.log('DELETE_USER', {userId});

    await UserModel.query(getPrimary(trx))
        .delete()
        .where(UserModelColumn.UserId, userId)
        .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

    ctx.log('DELETE_USER_SUCCESS', {userId});
};
