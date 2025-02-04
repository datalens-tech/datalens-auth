import {UserRole} from '../../constants/role';
import {RoleModel, RoleModelColumn} from '../../db/models/role';
import {BigIntId} from '../../db/types/id';
import {getPrimary, getReplica} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';

const SPLITTER = '~@~';
type RoleAndUserIdKey = `${UserRole}${typeof SPLITTER}${BigIntId}`;

export interface RemoveUsersRolesArgs {
    deltas: {role: `${UserRole}`; subjectId: BigIntId}[];
}

export const removeUsersRoles = async ({ctx, trx}: ServiceArgs, args: RemoveUsersRolesArgs) => {
    const {deltas} = args;

    ctx.log('REMOVE_USERS_ROLES');

    const allUsersIds = new Set<BigIntId>();

    for (const delta of deltas) {
        const {subjectId} = delta;
        allUsersIds.add(subjectId);
    }

    const roleModels = await RoleModel.query(getReplica(trx))
        .select([RoleModelColumn.RoleId, RoleModelColumn.UserId, RoleModelColumn.Role])
        .whereIn(RoleModelColumn.UserId, Array.from(allUsersIds))
        .timeout(RoleModel.DEFAULT_QUERY_TIMEOUT);

    const roleAndUserIdToRoleModel: Record<RoleAndUserIdKey, RoleModel> = {};
    for (const roleModel of roleModels) {
        const userId = roleModel.userId;
        const roleAndUserIdKey: RoleAndUserIdKey = `${roleModel.role}${SPLITTER}${userId}`;
        roleAndUserIdToRoleModel[roleAndUserIdKey] = roleModel;
    }

    const roleIdsForRemove = new Set<BigIntId>();

    for (const delta of deltas) {
        const {subjectId, role} = delta;
        const roleAndUserIdKey: RoleAndUserIdKey = `${role}${SPLITTER}${subjectId}`;
        const roleModel = roleAndUserIdToRoleModel[roleAndUserIdKey];
        if (roleModel) {
            roleIdsForRemove.add(roleModel.roleId);
        }
    }

    await RoleModel.query(getPrimary(trx))
        .delete()
        .whereIn(RoleModelColumn.RoleId, Array.from(roleIdsForRemove))
        .timeout(RoleModel.DEFAULT_QUERY_TIMEOUT);

    ctx.log('REMOVE_USERS_ROLES_SUCCESS');
};
