import {AppError} from '@gravity-ui/nodekit';

import {AUTH_ERROR} from '../../constants/error-constants';
import {UserRole} from '../../constants/role';
import {ServiceAccountModel, ServiceAccountModelColumn} from '../../db/models/service-account';
import type {BigIntId} from '../../db/types/id';
import {getPrimary, getReplica} from '../../db/utils/db';
import {setCurrentTime} from '../../db/utils/query';
import {ServiceArgs} from '../../types/service';

export type RemoveServiceAccountRolesArgs = {
    serviceAccountId: BigIntId;
    roles: `${UserRole}`[];
};

export const removeServiceAccountRoles = async (
    {ctx, trx}: ServiceArgs,
    args: RemoveServiceAccountRolesArgs,
): Promise<void> => {
    const {serviceAccountId, roles} = args;

    ctx.log('REMOVE_SERVICE_ACCOUNT_ROLES', {serviceAccountId});

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

    const removeSet = new Set(roles);
    const remaining = sa.roles.filter((r) => !removeSet.has(r));

    await ServiceAccountModel.query(getPrimary(trx))
        .patch({
            [ServiceAccountModelColumn.Roles]: remaining,
            [ServiceAccountModelColumn.UpdatedAt]: setCurrentTime(),
        })
        .where(ServiceAccountModelColumn.ServiceAccountId, serviceAccountId)
        .timeout(ServiceAccountModel.DEFAULT_QUERY_TIMEOUT);

    ctx.log('REMOVE_SERVICE_ACCOUNT_ROLES_SUCCESS', {serviceAccountId});
};
