import {AppError} from '@gravity-ui/nodekit';
import {raw} from 'objection';

import {AUTH_ERROR} from '../../constants/error-constants';
import {ServiceAccountModel, ServiceAccountModelColumn} from '../../db/models/service-account';
import type {BigIntId} from '../../db/types/id';
import {getPrimary} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';

export const revokeServiceAccount = async (
    {ctx, trx}: ServiceArgs,
    {serviceAccountId}: {serviceAccountId: BigIntId},
) => {
    ctx.log('REVOKE_SERVICE_ACCOUNT', {serviceAccountId});

    const updated = await ServiceAccountModel.query(getPrimary(trx))
        .patch({[ServiceAccountModelColumn.RevokedAt]: raw('NOW()')})
        .where(ServiceAccountModelColumn.ServiceAccountId, serviceAccountId)
        .whereNull(ServiceAccountModelColumn.RevokedAt)
        .returning(ServiceAccountModelColumn.ServiceAccountId)
        .first()
        .timeout(ServiceAccountModel.DEFAULT_QUERY_TIMEOUT);

    if (!updated) {
        throw new AppError(AUTH_ERROR.SERVICE_ACCOUNT_NOT_EXISTS, {
            code: AUTH_ERROR.SERVICE_ACCOUNT_NOT_EXISTS,
        });
    }

    ctx.log('REVOKE_SERVICE_ACCOUNT_SUCCESS', {serviceAccountId});

    return {serviceAccountId};
};
