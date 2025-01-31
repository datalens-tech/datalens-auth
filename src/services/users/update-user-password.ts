import crypto from 'node:crypto';

import {AppError} from '@gravity-ui/nodekit';

import {comparePasswords, hashPassword} from '../../components/passwords';
import {AUTH_ERROR} from '../../constants/error-constants';
import {UserModel, UserModelColumn} from '../../db/models/user';
import type {BigIntId} from '../../db/types/id';
import {getPrimary, getReplica} from '../../db/utils/db';
import {setCurrentTime} from '../../db/utils/query';
import {ServiceArgs} from '../../types/service';

export interface UpdateUserPasswordArgs {
    userId: BigIntId;
    newPassword: string;
    oldPassword: string;
    checkOldPassword: boolean;
}

export const updateUserPassword = async ({ctx, trx}: ServiceArgs, args: UpdateUserPasswordArgs) => {
    const {userId, newPassword, oldPassword, checkOldPassword} = args;

    ctx.log('UPDATE_USER_PASSWORD', {userId});

    const user = await UserModel.query(getReplica(trx))
        .select([UserModelColumn.UserId, UserModelColumn.Password])
        .where(UserModelColumn.UserId, userId)
        .first()
        .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

    if (!user) {
        throw new AppError(AUTH_ERROR.USER_NOT_EXISTS, {code: AUTH_ERROR.USER_NOT_EXISTS});
    }

    if (checkOldPassword) {
        const isPasswordsEqual = await comparePasswords({
            inputPassword: oldPassword,
            storedPasswordHash: user.password ?? crypto.randomBytes(16).toString('hex'),
        });
        if (!isPasswordsEqual) {
            throw new AppError(AUTH_ERROR.OLD_PASSWORD_INCORRECT, {
                code: AUTH_ERROR.OLD_PASSWORD_INCORRECT,
            });
        }
    }

    const hashedPassword = await hashPassword(newPassword);

    await UserModel.query(getPrimary(trx))
        .patch({
            [UserModelColumn.Password]: hashedPassword,
            [UserModelColumn.UpdatedAt]: setCurrentTime(),
        })
        .where({
            [UserModelColumn.UserId]: userId,
        })
        .returning(UserModelColumn.UserId)
        .first()
        .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

    ctx.log('UPDATE_USER_PASSWORD_SUCCESS');
};
