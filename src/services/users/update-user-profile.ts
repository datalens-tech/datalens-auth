import {AppError} from '@gravity-ui/nodekit';

import {AUTH_ERROR} from '../../constants/error-constants';
import {UserModel, UserModelColumn} from '../../db/models/user';
import type {BigIntId} from '../../db/types/id';
import {getPrimary} from '../../db/utils/db';
import {setCurrentTime} from '../../db/utils/query';
import {ServiceArgs} from '../../types/service';
import type {Nullable} from '../../utils/utility-types';

export interface UpdateUserProfileArgs {
    userId: BigIntId;
    email?: Nullable<string>;
    firstName?: Nullable<string>;
    lastName?: Nullable<string>;
}

export const updateUserProfile = async ({ctx, trx}: ServiceArgs, args: UpdateUserProfileArgs) => {
    const {userId, email, firstName, lastName} = args;

    ctx.log('UPDATE_USER_PROFILE', {userId});

    const patchedUserModel = await UserModel.query(getPrimary(trx))
        .patch({
            [UserModelColumn.Email]: email,
            [UserModelColumn.FirstName]: firstName,
            [UserModelColumn.LastName]: lastName,
            [UserModelColumn.UpdatedAt]: setCurrentTime(),
        })
        .where({
            [UserModelColumn.UserId]: userId,
        })
        .returning(UserModelColumn.UserId)
        .first()
        .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

    if (!patchedUserModel) {
        throw new AppError(AUTH_ERROR.USER_NOT_EXISTS, {code: AUTH_ERROR.USER_NOT_EXISTS});
    }

    ctx.log('UPDATE_USER_PROFILE_SUCCESS');
};
