import {ServiceAccountModel, ServiceAccountModelColumn} from '../../db/models/service-account';
import {getReplica} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';

export const listServiceAccounts = async ({ctx, trx}: ServiceArgs) => {
    ctx.log('LIST_SERVICE_ACCOUNTS');

    const result = await ServiceAccountModel.query(getReplica(trx))
        .select([
            ServiceAccountModelColumn.ServiceAccountId,
            ServiceAccountModelColumn.Name,
            ServiceAccountModelColumn.Description,
            ServiceAccountModelColumn.Roles,
            ServiceAccountModelColumn.CreatedAt,
        ])
        .orderBy(ServiceAccountModelColumn.CreatedAt, 'desc')
        .timeout(ServiceAccountModel.DEFAULT_QUERY_TIMEOUT);

    return result;
};
