import {AppError} from '@gravity-ui/nodekit';
import pick from 'lodash/pick';

import {AUTH_ERROR} from '../../constants/error-constants';
import {UserRole} from '../../constants/role';
import {RoleModel, RoleModelColumn} from '../../db/models/role';
import {UserModel, UserModelColumn} from '../../db/models/user';
import type {BigIntId} from '../../db/types/id';
import type {ModelInstance} from '../../db/types/model';
import {getReplica} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';
import type {ArrayElement} from '../../utils/utility-types';

const selectedUserColumns = [
    UserModelColumn.UserId,
    UserModelColumn.Login,
    UserModelColumn.Email,
    UserModelColumn.FirstName,
    UserModelColumn.LastName,
] as const;

const selectedRoleColumns = [RoleModelColumn.Role] as const;

const selectedJoinedColumns = [
    ...selectedUserColumns.map((col) => `${UserModel.tableName}.${col}`),
    ...selectedRoleColumns.map((col) => `${RoleModel.tableName}.${col}`),
];

type SelectedUserColumns = Pick<UserModel, ArrayElement<typeof selectedUserColumns>>;

type JoinedColumns = SelectedUserColumns &
    Pick<RoleModel, ArrayElement<typeof selectedRoleColumns>>;

type JoinedUserRoleModel = ModelInstance<JoinedColumns>;

export type UserProfile = SelectedUserColumns & {roles: `${UserRole}`[]};

export interface GetUserProfileArgs {
    userId: BigIntId;
}

export const getUserProfile = async ({ctx, trx}: ServiceArgs, args: GetUserProfileArgs) => {
    const {userId} = args;

    ctx.log('GET_USER_PROFILE', {userId});

    const result = (await UserModel.query(getReplica(trx))
        .select(selectedJoinedColumns)
        .leftJoin(
            RoleModel.tableName,
            `${UserModel.tableName}.${UserModelColumn.UserId}`,
            `${RoleModel.tableName}.${RoleModelColumn.UserId}`,
        )
        .where(`${UserModel.tableName}.${UserModelColumn.UserId}`, userId)
        .timeout(UserModel.DEFAULT_QUERY_TIMEOUT)) as unknown as JoinedUserRoleModel[];

    if (result.length === 0) {
        throw new AppError(AUTH_ERROR.USER_NOT_EXISTS, {code: AUTH_ERROR.USER_NOT_EXISTS});
    }

    const roles = result.map((item) => item.role);
    const userProfile = {
        ...pick(result[0], selectedUserColumns),
        roles,
    };

    ctx.log('GET_USER_PROFILE_SUCCESS');

    return userProfile;
};
