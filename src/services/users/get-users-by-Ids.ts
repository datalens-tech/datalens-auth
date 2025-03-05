import {UserModel, UserModelColumn} from '../../db/models/user';
import type {BigIntId} from '../../db/types/id';
import {getReplica} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';

export interface GetUsersByIdsArgs {
    subjectIds: BigIntId[];
}

export const getUsersByIds = async ({ctx, trx}: ServiceArgs, args: GetUsersByIdsArgs) => {
    const {subjectIds} = args;

    ctx.log('GET_USERS_BY_IDS', {idsSize: subjectIds.length});

    const users = await UserModel.query(getReplica(trx))
        .select([
            UserModelColumn.UserId,
            UserModelColumn.Login,
            UserModelColumn.Email,
            UserModelColumn.FirstName,
            UserModelColumn.LastName,
            UserModelColumn.IdpSlug,
            UserModelColumn.IdpType,
        ])
        .whereIn(UserModelColumn.UserId, Array.from(new Set(subjectIds)))
        .limit(1000)
        .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

    const userIdToUser: Record<BigIntId, UserModel> = {};
    for (const user of users) {
        userIdToUser[user.userId] = user;
    }

    const result = subjectIds.map((subjectId) => userIdToUser[subjectId]).filter(Boolean);

    ctx.log('GET_USERS_BY_IDS_SUCCESS', {usersSize: result.length});

    return {users: result};
};
