import pick from 'lodash/pick';

import {UserRole} from '../../constants/role';
import {RoleModel, RoleModelColumn} from '../../db/models/role';
import {UserModel, UserModelColumn} from '../../db/models/user';
import type {BigIntId} from '../../db/types/id';
import type {ModelInstance} from '../../db/types/model';
import {getReplica} from '../../db/utils/db';
import {getNextPageToken, searchSubstring} from '../../db/utils/query';
import {ServiceArgs} from '../../types/service';
import type {ArrayElement, NullableValues} from '../../utils/utility-types';

const selectedUserColumns = [
    UserModelColumn.UserId,
    UserModelColumn.Login,
    UserModelColumn.Email,
    UserModelColumn.FirstName,
    UserModelColumn.LastName,
    UserModelColumn.IdpSlug,
    UserModelColumn.IdpType,
] as const;

const selectedRoleColumns = [RoleModelColumn.Role] as const;

const selectedJoinedColumns = [
    ...selectedUserColumns.map((col) => `${UserModel.tableName}.${col}`),
    ...selectedRoleColumns.map((col) => `${RoleModel.tableName}.${col}`),
];

type SelectedUserColumns = Pick<UserModel, ArrayElement<typeof selectedUserColumns>>;

type JoinedColumns = SelectedUserColumns &
    NullableValues<Pick<RoleModel, ArrayElement<typeof selectedRoleColumns>>>;

type JoinedUserRoleModel = ModelInstance<JoinedColumns>;

export type ResultUser = SelectedUserColumns & {roles: `${UserRole}`[]};

export interface GetUserListArgs {
    page?: number;
    pageSize?: number;
    filterString?: string;
    idpType?: string;
    roles?: `${UserRole}`[];
}

export const getUsersList = async ({ctx, trx}: ServiceArgs, args: GetUserListArgs) => {
    const {page = 0, pageSize = 20, filterString, roles, idpType} = args;

    ctx.log('GET_USERS_LIST');

    const result = (await UserModel.query(getReplica(trx))
        .select(selectedJoinedColumns)
        .leftJoin(
            RoleModel.tableName,
            `${UserModel.tableName}.${UserModelColumn.UserId}`,
            `${RoleModel.tableName}.${RoleModelColumn.UserId}`,
        )
        .whereIn(`${UserModel.tableName}.${UserModelColumn.UserId}`, (builder) => {
            builder
                .distinct(`${UserModel.tableName}.${UserModelColumn.UserId}`)
                .from(UserModel.tableName)
                .leftJoin(
                    RoleModel.tableName,
                    `${UserModel.tableName}.${UserModelColumn.UserId}`,
                    `${RoleModel.tableName}.${RoleModelColumn.UserId}`,
                )
                .where((qb1) => {
                    if (filterString) {
                        qb1.where((qb2) => {
                            qb2.where(
                                searchSubstring({
                                    column: `${UserModel.tableName}.${UserModelColumn.Login}`,
                                    search: filterString,
                                }),
                            )
                                .orWhere(
                                    searchSubstring({
                                        column: `${UserModel.tableName}.${UserModelColumn.Email}`,
                                        search: filterString,
                                    }),
                                )
                                .orWhere(
                                    searchSubstring({
                                        column: `${UserModel.tableName}.${UserModelColumn.FirstName}`,
                                        search: filterString,
                                    }),
                                )
                                .orWhere(
                                    searchSubstring({
                                        column: `${UserModel.tableName}.${UserModelColumn.LastName}`,
                                        search: filterString,
                                    }),
                                );
                        });
                    }

                    if (roles) {
                        qb1.whereIn(`${RoleModel.tableName}.${RoleModelColumn.Role}`, roles);
                    }

                    if (idpType) {
                        qb1.where(
                            `${UserModel.tableName}.${UserModelColumn.IdpType}`,
                            idpType === 'null' ? null : idpType,
                        );
                    }
                })
                .limit(pageSize)
                .offset(pageSize * page);
        })
        .orderBy(`${UserModel.tableName}.${UserModelColumn.UserId}`)
        .timeout(UserModel.DEFAULT_QUERY_TIMEOUT)) as unknown as JoinedUserRoleModel[];

    const userIdToUser: Record<BigIntId, ResultUser> = {};
    const userIdsOrder: BigIntId[] = [];

    for (const item of result) {
        const role = item.role;

        if (item.userId in userIdToUser) {
            const resultUser = userIdToUser[item.userId];
            userIdToUser[item.userId] = {
                ...resultUser,
                roles: role ? [...resultUser.roles, role] : resultUser.roles,
            };
        } else {
            userIdsOrder.push(item.userId);
            userIdToUser[item.userId] = {
                ...pick(item, selectedUserColumns),
                roles: role ? [role] : [],
            };
        }
    }

    const users = userIdsOrder.map((userId) => userIdToUser[userId]);

    const nextPageToken = getNextPageToken({
        page,
        pageSize,
        curPage: users,
    });

    ctx.log('GET_USERS_LIST_SUCCESS');

    return {nextPageToken, users};
};
