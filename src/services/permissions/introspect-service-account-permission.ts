import {Permission} from '../../constants/permission';
import {ServiceAccountModel, ServiceAccountModelColumn} from '../../db/models/service-account';
import type {BigIntId} from '../../db/types/id';
import {getReplica} from '../../db/utils/db';
import type {ServiceArgs} from '../../types/service';
import {checkPermission} from '../../utils/permission';

export type IntrospectServiceAccountPermissionArgs = {
    serviceAccountId: BigIntId;
    permission: `${Permission}`;
};

export async function introspectServiceAccountPermission(
    {ctx, trx}: ServiceArgs,
    args: IntrospectServiceAccountPermissionArgs,
): Promise<boolean> {
    const {serviceAccountId, permission} = args;

    ctx.log('INTROSPECT_SERVICE_ACCOUNT_PERMISSION', {serviceAccountId, permission});

    const sa = await ServiceAccountModel.query(getReplica(trx))
        .select(ServiceAccountModelColumn.Roles)
        .where(ServiceAccountModelColumn.ServiceAccountId, serviceAccountId)
        .first()
        .timeout(ServiceAccountModel.DEFAULT_QUERY_TIMEOUT);

    if (!sa) {
        ctx.log('INTROSPECT_SERVICE_ACCOUNT_PERMISSION_NOT_FOUND');
        return false;
    }

    const hasPermission = sa.roles.some((role) => checkPermission({role, permission}));

    ctx.log('INTROSPECT_SERVICE_ACCOUNT_PERMISSION_RESULT', {hasPermission});

    return hasPermission;
}
