import {Permission} from '../../constants/permission';
import {
    ServiceAccountRoleModel,
    ServiceAccountRoleModelColumn,
} from '../../db/models/service-account-role';
import type {BigIntId} from '../../db/types/id';
import {getReplica} from '../../db/utils/db';
import type {ServiceArgs} from '../../types/service';
import {checkPermission} from '../../utils/permission';

export type IntrospectServiceAccountPermissionArgs = {
    serviceAccountId: BigIntId;
    permission: `${Permission}`;
};

export const introspectServiceAccountPermission = async (
    {ctx, trx}: ServiceArgs,
    args: IntrospectServiceAccountPermissionArgs,
): Promise<boolean> => {
    const {serviceAccountId, permission} = args;

    ctx.log('INTROSPECT_SERVICE_ACCOUNT_PERMISSION', {serviceAccountId, permission});

    const serviceAccountRoles = await ServiceAccountRoleModel.query(getReplica(trx))
        .select(ServiceAccountRoleModelColumn.Role)
        .where(ServiceAccountRoleModelColumn.ServiceAccountId, serviceAccountId)
        .timeout(ServiceAccountRoleModel.DEFAULT_QUERY_TIMEOUT);

    if (serviceAccountRoles.length === 0) {
        ctx.log('INTROSPECT_SERVICE_ACCOUNT_PERMISSION_NO_ROLES');
        return false;
    }

    const hasPermission = serviceAccountRoles.some((roleRecord) =>
        checkPermission({role: roleRecord.role, permission}),
    );

    ctx.log('INTROSPECT_SERVICE_ACCOUNT_PERMISSION_RESULT', {hasPermission});

    return hasPermission;
};
