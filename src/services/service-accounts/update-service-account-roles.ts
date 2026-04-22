import {AppError} from '@gravity-ui/nodekit';

import {AUTH_ERROR} from '../../constants/error-constants';
import {UserRole} from '../../constants/role';
import {
    ServiceAccountRoleModel,
    ServiceAccountRoleModelColumn,
} from '../../db/models/service-account-role';
import {BigIntId} from '../../db/types/id';
import {getPrimary, getReplica} from '../../db/utils/db';
import {setCurrentTime} from '../../db/utils/query';
import {ServiceArgs} from '../../types/service';
import {encodeId} from '../../utils/ids';

const SPLITTER = '~@~';
type RoleAndServiceAccountIdKey = `${UserRole}${typeof SPLITTER}${BigIntId}`;

type UpsertData = {
    serviceAccountId: BigIntId;
    roleId: BigIntId;
    role: `${UserRole}`;
}[];

export type UpdateServiceAccountRolesArgs = {
    deltas: {oldRole: `${UserRole}`; newRole: `${UserRole}`; subjectId: BigIntId}[];
};

export const updateServiceAccountRoles = async (
    {ctx, trx}: ServiceArgs,
    args: UpdateServiceAccountRolesArgs,
): Promise<void> => {
    const {deltas} = args;

    ctx.log('UPDATE_SERVICE_ACCOUNT_ROLES');

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

    const serviceAccountIdToRoles: Record<BigIntId, Set<`${UserRole}`>> = {};
    const roleAndServiceAccountIdToRoleModel: Record<
        RoleAndServiceAccountIdKey,
        ServiceAccountRoleModel
    > = {};
    for (const roleModel of roleModels) {
        const serviceAccountId = roleModel.serviceAccountId;
        const roleAndServiceAccountIdKey: RoleAndServiceAccountIdKey = `${roleModel.role}${SPLITTER}${serviceAccountId}`;
        roleAndServiceAccountIdToRoleModel[roleAndServiceAccountIdKey] = roleModel;

        if (serviceAccountId in serviceAccountIdToRoles) {
            serviceAccountIdToRoles[serviceAccountId].add(roleModel.role);
        } else {
            serviceAccountIdToRoles[serviceAccountId] = new Set([roleModel.role]);
        }
    }

    const upsertData: UpsertData = [];

    for (const delta of deltas) {
        const {subjectId, oldRole, newRole} = delta;
        const serviceAccountRoles = serviceAccountIdToRoles[subjectId];
        if (!serviceAccountRoles || !serviceAccountRoles.has(oldRole)) {
            throw new AppError(
                `The specified old role "${oldRole}" was not found for service account "${encodeId(subjectId)}"`,
                {
                    code: AUTH_ERROR.ROLE_NOT_EXISTS,
                },
            );
        }
        if (serviceAccountRoles.has(newRole)) {
            throw new AppError(
                `The specified new role "${newRole}" already exists for service account "${encodeId(subjectId)}"`,
                {
                    code: AUTH_ERROR.NOT_CONSISTENT,
                },
            );
        }

        const roleAndServiceAccountIdKey: RoleAndServiceAccountIdKey = `${oldRole}${SPLITTER}${subjectId}`;
        const roleModel = roleAndServiceAccountIdToRoleModel[roleAndServiceAccountIdKey];
        if (!roleModel) {
            throw new AppError(AUTH_ERROR.ROLE_NOT_EXISTS, {
                code: AUTH_ERROR.ROLE_NOT_EXISTS,
            });
        }
        upsertData.push({
            serviceAccountId: roleModel.serviceAccountId,
            roleId: roleModel.roleId,
            role: newRole,
        });
    }

    await ServiceAccountRoleModel.query(getPrimary(trx))
        .insert(
            upsertData.map(({serviceAccountId, role, roleId}) => ({
                [ServiceAccountRoleModelColumn.RoleId]: roleId,
                [ServiceAccountRoleModelColumn.ServiceAccountId]: serviceAccountId,
                [ServiceAccountRoleModelColumn.Role]: role,
                [ServiceAccountRoleModelColumn.UpdatedAt]: setCurrentTime(),
            })),
        )
        .onConflict(ServiceAccountRoleModelColumn.RoleId)
        .merge()
        .timeout(ServiceAccountRoleModel.DEFAULT_QUERY_TIMEOUT);

    ctx.log('UPDATE_SERVICE_ACCOUNT_ROLES_SUCCESS');
};
