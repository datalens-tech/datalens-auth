import {
    ServiceAccountKeyModel,
    ServiceAccountKeyModelColumn,
} from '../../db/models/service-account-key';
import type {BigIntId} from '../../db/types/id';
import {getReplica} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';

export type ServiceAccountKey = Pick<
    ServiceAccountKeyModel,
    'keyId' | 'createdAt' | 'serviceAccountId'
>;

type ListServiceAccountKeysResult = ServiceAccountKey[];

export const listServiceAccountKeys = async (
    {ctx, trx}: ServiceArgs,
    {serviceAccountId}: {serviceAccountId: BigIntId},
): Promise<ListServiceAccountKeysResult> => {
    ctx.log('LIST_SERVICE_ACCOUNT_KEYS');

    return ServiceAccountKeyModel.query(getReplica(trx))
        .select([
            ServiceAccountKeyModelColumn.KeyId,
            ServiceAccountKeyModelColumn.CreatedAt,
            ServiceAccountKeyModelColumn.ServiceAccountId,
        ])
        .where(ServiceAccountKeyModelColumn.ServiceAccountId, serviceAccountId)
        .orderBy(ServiceAccountKeyModelColumn.CreatedAt, 'desc')
        .timeout(ServiceAccountKeyModel.DEFAULT_QUERY_TIMEOUT);
};
