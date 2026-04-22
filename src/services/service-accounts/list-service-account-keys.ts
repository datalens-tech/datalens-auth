import {
    ServiceAccountKeyModel,
    ServiceAccountKeyModelColumn,
} from '../../db/models/service-account-key';
import type {BigIntId} from '../../db/types/id';
import {getReplica} from '../../db/utils/db';
import {getNextPageToken} from '../../db/utils/query';
import {ServiceArgs} from '../../types/service';

export type ServiceAccountKey = Pick<
    ServiceAccountKeyModel,
    'keyId' | 'createdAt' | 'serviceAccountId'
>;

export type ListServiceAccountKeysArgs = {
    serviceAccountId: BigIntId;
    page?: number;
    pageSize?: number;
};

export type ListServiceAccountKeysResult = {
    nextPageToken?: string;
    keys: ServiceAccountKey[];
};

export const listServiceAccountKeys = async (
    {ctx, trx}: ServiceArgs,
    args: ListServiceAccountKeysArgs,
): Promise<ListServiceAccountKeysResult> => {
    const {serviceAccountId, page = 0, pageSize = 20} = args;

    ctx.log('LIST_SERVICE_ACCOUNT_KEYS', {serviceAccountId});

    const keys = await ServiceAccountKeyModel.query(getReplica(trx))
        .select([
            ServiceAccountKeyModelColumn.KeyId,
            ServiceAccountKeyModelColumn.CreatedAt,
            ServiceAccountKeyModelColumn.ServiceAccountId,
        ])
        .where(ServiceAccountKeyModelColumn.ServiceAccountId, serviceAccountId)
        .orderBy(ServiceAccountKeyModelColumn.KeyId, 'desc')
        .limit(pageSize)
        .offset(pageSize * page)
        .timeout(ServiceAccountKeyModel.DEFAULT_QUERY_TIMEOUT);

    const nextPageToken = getNextPageToken({
        page,
        pageSize,
        curPage: keys,
    });

    ctx.log('LIST_SERVICE_ACCOUNT_KEYS_SUCCESS');

    return {nextPageToken, keys};
};
