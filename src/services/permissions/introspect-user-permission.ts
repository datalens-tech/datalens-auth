import {Permission} from '../../constants/permission';
import {RoleModel, RoleModelColumn} from '../../db/models/role';
import type {BigIntId} from '../../db/types/id';
import {getReplica} from '../../db/utils/db';
import type {ServiceArgs} from '../../types/service';
import {checkPermission} from '../../utils/permission';

export interface IntrospectUserPermissionArgs {
    userId: BigIntId;
    permission: `${Permission}`;
}

export async function introspectUserPermission(
    {ctx, trx}: ServiceArgs,
    args: IntrospectUserPermissionArgs,
): Promise<boolean> {
    const {userId, permission} = args;

    ctx.log('INTROSPECT_USER_PERMISSION', {userId, permission});

    const userRoles = await RoleModel.query(getReplica(trx))
        .select(RoleModelColumn.Role)
        .where(RoleModelColumn.UserId, userId)
        .timeout(RoleModel.DEFAULT_QUERY_TIMEOUT);

    if (userRoles.length === 0) {
        ctx.log('INTROSPECT_USER_PERMISSION_NO_ROLES');
        return false;
    }

    const hasPermission = userRoles.some((roleRecord) =>
        checkPermission({role: roleRecord.role, permission}),
    );

    ctx.log('INTROSPECT_USER_PERMISSION_RESULT', {hasPermission});

    return hasPermission;
}
