import {UserRole} from '../../constants/role';
import {
    ServiceAccountRoleModel,
    ServiceAccountRoleModelColumn,
} from '../../db/models/service-account-role';
import {BigIntId} from '../../db/types/id';
import {getPrimary, getReplica} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';

const SPLITTER = '~@~';
type RoleAndServiceAccountIdKey = `${UserRole}${typeof SPLITTER}${BigIntId}`;

export type RemoveServiceAccountRolesArgs = {
    deltas: {role: `${UserRole}`; subjectId: BigIntId}[];
};

export const removeServiceAccountRoles = async (
    {ctx, trx}: ServiceArgs,
    args: RemoveServiceAccountRolesArgs,
): Promise<void> => {
    const {deltas} = args;

    ctx.log('REMOVE_SERVICE_ACCOUNT_ROLES');

    const allServiceAccountIds = new Set<BigIntId>();

    for (const delta of deltas) {
        const {subjectId} = delta;
        allServiceAccountIds.add(subjectId);
    }

    const roleModels = await ServiceAccountRoleModel.query(getReplica(trx))
        .select([
            ServiceAccountRoleModelColumn.RoleId,
            ServiceAccountRoleModelColumn.ServiceAccountId,
            ServiceAccountRoleModelColumn.Role,
        ])
        .whereIn(ServiceAccountRoleModelColumn.ServiceAccountId, Array.from(allServiceAccountIds))
        .timeout(ServiceAccountRoleModel.DEFAULT_QUERY_TIMEOUT);

    const roleAndServiceAccountIdToRoleModel: Record<
        RoleAndServiceAccountIdKey,
        ServiceAccountRoleModel
    > = {};
    for (const roleModel of roleModels) {
        const serviceAccountId = roleModel.serviceAccountId;
        const roleAndServiceAccountIdKey: RoleAndServiceAccountIdKey = `${roleModel.role}${SPLITTER}${serviceAccountId}`;
        roleAndServiceAccountIdToRoleModel[roleAndServiceAccountIdKey] = roleModel;
    }

    const roleIdsForRemove = new Set<BigIntId>();

    for (const delta of deltas) {
        const {subjectId, role} = delta;
        const roleAndServiceAccountIdKey: RoleAndServiceAccountIdKey = `${role}${SPLITTER}${subjectId}`;
        const roleModel = roleAndServiceAccountIdToRoleModel[roleAndServiceAccountIdKey];
        if (roleModel) {
            roleIdsForRemove.add(roleModel.roleId);
        }
    }

    await ServiceAccountRoleModel.query(getPrimary(trx))
        .delete()
        .whereIn(ServiceAccountRoleModelColumn.RoleId, Array.from(roleIdsForRemove))
        .timeout(ServiceAccountRoleModel.DEFAULT_QUERY_TIMEOUT);

    ctx.log('REMOVE_SERVICE_ACCOUNT_ROLES_SUCCESS');
};
