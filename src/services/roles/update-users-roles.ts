import {AppError} from '@gravity-ui/nodekit';

import {AUTH_ERROR} from '../../constants/error-constants';
import {UserRole} from '../../constants/role';
import {RoleModel, RoleModelColumn} from '../../db/models/role';
import {BigIntId} from '../../db/types/id';
import {getPrimary, getReplica} from '../../db/utils/db';
import {setCurrentTime} from '../../db/utils/query';
import {ServiceArgs} from '../../types/service';
import {encodeId} from '../../utils/ids';

const SPLITTER = '~@~';
type RoleAndUserIdKey = `${UserRole}${typeof SPLITTER}${BigIntId}`;

type UpsertData = {
    userId: BigIntId;
    roleId: BigIntId;
    role: `${UserRole}`;
}[];

export interface UpdateUsersRolesArgs {
    deltas: {oldRole: `${UserRole}`; newRole: `${UserRole}`; subjectId: BigIntId}[];
}

export const updateUsersRoles = async ({ctx, trx}: ServiceArgs, args: UpdateUsersRolesArgs) => {
    const {deltas} = args;

    ctx.log('ADD_USERS_ROLES');

    const allUsersIds = new Set<BigIntId>();

    for (const delta of deltas) {
        const {subjectId} = delta;
        allUsersIds.add(subjectId);
    }

    const roleModels = await RoleModel.query(getReplica(trx))
        .select([RoleModelColumn.RoleId, RoleModelColumn.UserId, RoleModelColumn.Role])
        .whereIn(RoleModelColumn.UserId, Array.from(allUsersIds))
        .timeout(RoleModel.DEFAULT_QUERY_TIMEOUT);

    const userIdToRoles: Record<BigIntId, Set<`${UserRole}`>> = {};
    const roleAndUserIdToRoleModel: Record<RoleAndUserIdKey, RoleModel> = {};
    for (const roleModel of roleModels) {
        const userId = roleModel.userId;
        const roleAndUserIdKey: RoleAndUserIdKey = `${roleModel.role}${SPLITTER}${userId}`;
        roleAndUserIdToRoleModel[roleAndUserIdKey] = roleModel;

        if (userId in userIdToRoles) {
            userIdToRoles[userId].add(roleModel.role);
        } else {
            userIdToRoles[userId] = new Set([roleModel.role]);
        }
    }

    const upsertData: UpsertData = [];

    for (const delta of deltas) {
        const {subjectId, oldRole, newRole} = delta;
        const userRoles = userIdToRoles[subjectId];
        if (!userRoles || !userRoles.has(oldRole)) {
            throw new AppError(
                `The specified old role "${oldRole}" was not found for user "${encodeId(subjectId)}"`,
                {
                    code: AUTH_ERROR.ROLE_NOT_EXISTS,
                },
            );
        }
        if (userRoles.has(newRole)) {
            throw new AppError(
                `The specified new role "${newRole}" already exists for user "${encodeId(subjectId)}"`,
                {
                    code: AUTH_ERROR.NOT_CONSISTENT,
                },
            );
        }

        const roleAndUserIdKey: RoleAndUserIdKey = `${oldRole}${SPLITTER}${subjectId}`;
        const roleModel = roleAndUserIdToRoleModel[roleAndUserIdKey];
        if (!roleModel) {
            throw new AppError(AUTH_ERROR.ROLE_NOT_EXISTS, {
                code: AUTH_ERROR.ROLE_NOT_EXISTS,
            });
        }
        upsertData.push({
            userId: roleModel.userId,
            roleId: roleModel.roleId,
            role: newRole,
        });
    }

    await RoleModel.query(getPrimary(trx))
        .insert(
            upsertData.map(({userId, role, roleId}) => ({
                [RoleModelColumn.RoleId]: roleId,
                [RoleModelColumn.UserId]: userId,
                [RoleModelColumn.Role]: role,
                [RoleModelColumn.UpdatedAt]: setCurrentTime(),
            })),
        )
        .onConflict(RoleModelColumn.RoleId)
        .merge()
        .timeout(RoleModel.DEFAULT_QUERY_TIMEOUT);

    ctx.log('ADD_USERS_ROLES_SUCCESS');
};
