import {AppError} from '@gravity-ui/nodekit';

import {AUTH_ERROR} from '../../constants/error-constants';
import {
    ServiceAccountKeyModel,
    ServiceAccountKeyModelColumn,
} from '../../db/models/service-account-key';
import type {BigIntId} from '../../db/types/id';
import {getPrimary} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';

export const deleteServiceAccountKey = async (
    {ctx, trx}: ServiceArgs,
    {serviceAccountId, keyId}: {serviceAccountId: BigIntId; keyId: BigIntId},
) => {
    ctx.log('DELETE_SERVICE_ACCOUNT_KEY', {keyId, serviceAccountId});

    const deleted = await ServiceAccountKeyModel.query(getPrimary(trx))
        .delete()
        .where(ServiceAccountKeyModelColumn.KeyId, keyId)
        .where(ServiceAccountKeyModelColumn.ServiceAccountId, serviceAccountId)
        .returning(ServiceAccountKeyModelColumn.KeyId)
        .first()
        .timeout(ServiceAccountKeyModel.DEFAULT_QUERY_TIMEOUT);

    if (!deleted) {
        throw new AppError(AUTH_ERROR.SERVICE_ACCOUNT_KEY_NOT_EXISTS, {
            code: AUTH_ERROR.SERVICE_ACCOUNT_KEY_NOT_EXISTS,
        });
    }

    ctx.log('DELETE_SERVICE_ACCOUNT_KEY_SUCCESS', {keyId, serviceAccountId});
};
