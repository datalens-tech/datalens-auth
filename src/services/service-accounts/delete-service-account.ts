import {AppError} from '@gravity-ui/nodekit';

import {AUTH_ERROR} from '../../constants/error-constants';
import {ServiceAccountModel, ServiceAccountModelColumn} from '../../db/models/service-account';
import type {BigIntId} from '../../db/types/id';
import {getPrimary} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';

export const deleteServiceAccount = async (
    {ctx, trx}: ServiceArgs,
    {serviceAccountId}: {serviceAccountId: BigIntId},
): Promise<void> => {
    ctx.log('DELETE_SERVICE_ACCOUNT', {serviceAccountId});

    const deleted = await ServiceAccountModel.query(getPrimary(trx))
        .delete()
        .where(ServiceAccountModelColumn.ServiceAccountId, serviceAccountId)
        .returning(ServiceAccountModelColumn.ServiceAccountId)
        .first()
        .timeout(ServiceAccountModel.DEFAULT_QUERY_TIMEOUT);

    if (!deleted) {
        throw new AppError(AUTH_ERROR.SERVICE_ACCOUNT_NOT_EXISTS, {
            code: AUTH_ERROR.SERVICE_ACCOUNT_NOT_EXISTS,
        });
    }

    ctx.log('DELETE_SERVICE_ACCOUNT_SUCCESS', {serviceAccountId});
};
