import {
    ServiceAccountKeyModel,
    ServiceAccountKeyModelColumn,
} from '../../db/models/service-account-key';
import type {BigIntId} from '../../db/types/id';
import {getReplica} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';

export const listServiceAccountKeys = async (
    {ctx, trx}: ServiceArgs,
    {serviceAccountId}: {serviceAccountId: BigIntId},
) => {
    ctx.log('LIST_SERVICE_ACCOUNT_KEYS');

    return ServiceAccountKeyModel.query(getReplica(trx))
        .select([ServiceAccountKeyModelColumn.KeyId, ServiceAccountKeyModelColumn.CreatedAt])
        .where(ServiceAccountKeyModelColumn.ServiceAccountId, serviceAccountId)
        .orderBy(ServiceAccountKeyModelColumn.CreatedAt, 'desc')
        .timeout(ServiceAccountKeyModel.DEFAULT_QUERY_TIMEOUT);
};
