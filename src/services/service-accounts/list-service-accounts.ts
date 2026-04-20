import {ServiceAccountModel, ServiceAccountModelColumn} from '../../db/models/service-account';
import {getReplica} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';

export type ListServiceAccountsResult = ServiceAccountModel[];

export const listServiceAccounts = async ({
    ctx,
    trx,
}: ServiceArgs): Promise<ListServiceAccountsResult> => {
    ctx.log('LIST_SERVICE_ACCOUNTS');

    const result = await ServiceAccountModel.query(getReplica(trx))
        .select()
        .orderBy(ServiceAccountModelColumn.CreatedAt, 'desc')
        .timeout(ServiceAccountModel.DEFAULT_QUERY_TIMEOUT);

    return result;
};
