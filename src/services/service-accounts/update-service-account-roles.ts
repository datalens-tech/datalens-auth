import {AppError} from '@gravity-ui/nodekit';

import {AUTH_ERROR} from '../../constants/error-constants';
import {UserRole} from '../../constants/role';
import {ServiceAccountModel, ServiceAccountModelColumn} from '../../db/models/service-account';
import type {BigIntId} from '../../db/types/id';
import {getPrimary, getReplica} from '../../db/utils/db';
import {setCurrentTime} from '../../db/utils/query';
import {ServiceArgs} from '../../types/service';

export type UpdateServiceAccountRolesArgs = {
    serviceAccountId: BigIntId;
    deltas: {oldRole: `${UserRole}`; newRole: `${UserRole}`}[];
};

export const updateServiceAccountRoles = async (
    {ctx, trx}: ServiceArgs,
    args: UpdateServiceAccountRolesArgs,
): Promise<void> => {
    const {serviceAccountId, deltas} = args;

    ctx.log('UPDATE_SERVICE_ACCOUNT_ROLES', {serviceAccountId});

    const sa = await ServiceAccountModel.query(getReplica(trx))
        .select([ServiceAccountModelColumn.ServiceAccountId, ServiceAccountModelColumn.Roles])
        .where(ServiceAccountModelColumn.ServiceAccountId, serviceAccountId)
        .first()
        .timeout(ServiceAccountModel.DEFAULT_QUERY_TIMEOUT);

    if (!sa) {
        throw new AppError(AUTH_ERROR.SERVICE_ACCOUNT_NOT_EXISTS, {
            code: AUTH_ERROR.SERVICE_ACCOUNT_NOT_EXISTS,
        });
    }

    const rolesSet = new Set(sa.roles);

    for (const {oldRole, newRole} of deltas) {
        if (!rolesSet.has(oldRole)) {
            throw new AppError(
                `The specified old role "${oldRole}" was not found for service account "${serviceAccountId}"`,
                {code: AUTH_ERROR.ROLE_NOT_EXISTS},
            );
        }
        if (rolesSet.has(newRole)) {
            throw new AppError(
                `The specified new role "${newRole}" already exists for service account "${serviceAccountId}"`,
                {code: AUTH_ERROR.NOT_CONSISTENT},
            );
        }
        rolesSet.delete(oldRole);
        rolesSet.add(newRole);
    }

    await ServiceAccountModel.query(getPrimary(trx))
        .patch({
            [ServiceAccountModelColumn.Roles]: Array.from(rolesSet),
            [ServiceAccountModelColumn.UpdatedAt]: setCurrentTime(),
        })
        .where(ServiceAccountModelColumn.ServiceAccountId, serviceAccountId)
        .timeout(ServiceAccountModel.DEFAULT_QUERY_TIMEOUT);

    ctx.log('UPDATE_SERVICE_ACCOUNT_ROLES_SUCCESS', {serviceAccountId});
};
