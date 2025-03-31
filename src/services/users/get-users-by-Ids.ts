import pick from 'lodash/pick';

import {RoleModel, RoleModelColumn} from '../../db/models/role';
import {UserModel, UserModelColumn} from '../../db/models/user';
import type {BigIntId} from '../../db/types/id';
import type {ModelInstance} from '../../db/types/model';
import {getReplica} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';
import type {ArrayElement, NullableValues} from '../../utils/utility-types';

const selectedUserColumns = [
    UserModelColumn.UserId,
    UserModelColumn.Login,
    UserModelColumn.Email,
    UserModelColumn.FirstName,
    UserModelColumn.LastName,
    UserModelColumn.IdpUserId,
    UserModelColumn.IdpType,
    UserModelColumn.IdpSlug,
] as const;

const selectedRoleColumns = [RoleModelColumn.Role, RoleModelColumn.RoleId] as const;

const selectedJoinedColumns = [
    ...selectedUserColumns.map((col) => `${UserModel.tableName}.${col}`),
    ...selectedRoleColumns.map((col) => `${RoleModel.tableName}.${col}`),
];

type SelectedUserColumns = Pick<UserModel, ArrayElement<typeof selectedUserColumns>>;

type SelectedRolesColumns = Pick<RoleModel, ArrayElement<typeof selectedRoleColumns>>;

type JoinedColumns = SelectedUserColumns & NullableValues<SelectedRolesColumns>;

type JoinedUserRoleModel = ModelInstance<JoinedColumns>;

export type UserById = SelectedUserColumns & {
    roles: SelectedRolesColumns[];
};

export interface GetUsersByIdsArgs {
    subjectIds: BigIntId[];
}

export const getUsersByIds = async ({ctx, trx}: ServiceArgs, args: GetUsersByIdsArgs) => {
    const {subjectIds} = args;

    const registry = ctx.get('registry');

    ctx.log('GET_USERS_BY_IDS', {idsSize: subjectIds.length});

    const users = (await UserModel.query(getReplica(trx))
        .select(selectedJoinedColumns)
        .leftJoin(
            RoleModel.tableName,
            `${UserModel.tableName}.${UserModelColumn.UserId}`,
            `${RoleModel.tableName}.${RoleModelColumn.UserId}`,
        )
        .whereIn(
            `${UserModel.tableName}.${UserModelColumn.UserId}`,
            Array.from(new Set(subjectIds)),
        )
        .timeout(UserModel.DEFAULT_QUERY_TIMEOUT)) as unknown as JoinedUserRoleModel[];

    const userIdToUser: Record<BigIntId, UserById> = {};
    for (const user of users) {
        const userById = userIdToUser[user.userId];
        const roleColumns = pick(user, selectedRoleColumns) as SelectedRolesColumns;
        if (!userById) {
            userIdToUser[user.userId] = {
                ...pick(user, selectedUserColumns),
                roles: user.role ? [roleColumns] : [],
            };
        } else if (user.role) {
            userById.roles.push(roleColumns);
        }
    }

    const result = subjectIds.map((subjectId) => userIdToUser[subjectId]).filter(Boolean);

    const {getUsersByIdsSuccess} = registry.common.functions.get();
    await getUsersByIdsSuccess({
        ctx,
        userIds: result.map((user) => user.userId),
    });

    ctx.log('GET_USERS_BY_IDS_SUCCESS', {usersSize: result.length});

    return {users: result};
};
