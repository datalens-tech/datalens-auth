import {UserRole} from '../../constants/role';
import {ServiceAccountModel, ServiceAccountModelColumn} from '../../db/models/service-account';
import {
    ServiceAccountRoleModel,
    ServiceAccountRoleModelColumn,
} from '../../db/models/service-account-role';
import type {BigIntId} from '../../db/types/id';
import {getReplica} from '../../db/utils/db';
import {getNextPageToken} from '../../db/utils/query';
import {ServiceArgs} from '../../types/service';
import type {ArrayElement} from '../../utils/utility-types';

const selectedServiceAccountColumns = [
    ServiceAccountModelColumn.ServiceAccountId,
    ServiceAccountModelColumn.Name,
    ServiceAccountModelColumn.Description,
    ServiceAccountModelColumn.CreatedAt,
    ServiceAccountModelColumn.UpdatedAt,
] as const;

type SelectedServiceAccountColumns = Pick<
    ServiceAccountModel,
    ArrayElement<typeof selectedServiceAccountColumns>
>;

export type ResultServiceAccount = SelectedServiceAccountColumns & {roles: `${UserRole}`[]};

export type ListServiceAccountsArgs = {
    page?: number;
    pageSize?: number;
};

export type ListServiceAccountsResult = {
    nextPageToken?: string;
    serviceAccounts: ResultServiceAccount[];
};

export const listServiceAccounts = async (
    {ctx, trx}: ServiceArgs,
    args: ListServiceAccountsArgs,
): Promise<ListServiceAccountsResult> => {
    const {page = 0, pageSize = 20} = args;

    ctx.log('LIST_SERVICE_ACCOUNTS');

    const serviceAccountPage = (await ServiceAccountModel.query(getReplica(trx))
        .select(selectedServiceAccountColumns)
        .orderBy(ServiceAccountModelColumn.ServiceAccountId, 'desc')
        .limit(pageSize)
        .offset(pageSize * page)
        .timeout(ServiceAccountModel.DEFAULT_QUERY_TIMEOUT)) as SelectedServiceAccountColumns[];

    const nextPageToken = getNextPageToken({
        page,
        pageSize,
        curPage: serviceAccountPage,
    });

    if (serviceAccountPage.length === 0) {
        ctx.log('LIST_SERVICE_ACCOUNTS_SUCCESS');
        return {nextPageToken, serviceAccounts: []};
    }

    const serviceAccountIds = serviceAccountPage.map((sa) => sa.serviceAccountId);

    const roleRows = await ServiceAccountRoleModel.query(getReplica(trx))
        .select([
            ServiceAccountRoleModelColumn.ServiceAccountId,
            ServiceAccountRoleModelColumn.Role,
        ])
        .whereIn(ServiceAccountRoleModelColumn.ServiceAccountId, serviceAccountIds)
        .timeout(ServiceAccountRoleModel.DEFAULT_QUERY_TIMEOUT);

    const rolesByServiceAccountId = new Map<BigIntId, `${UserRole}`[]>();
    for (const row of roleRows) {
        const existing = rolesByServiceAccountId.get(row.serviceAccountId);
        if (existing) {
            existing.push(row.role);
        } else {
            rolesByServiceAccountId.set(row.serviceAccountId, [row.role]);
        }
    }

    const serviceAccounts: ResultServiceAccount[] = serviceAccountPage.map((sa) => ({
        ...sa,
        roles: rolesByServiceAccountId.get(sa.serviceAccountId) ?? [],
    }));

    ctx.log('LIST_SERVICE_ACCOUNTS_SUCCESS');

    return {nextPageToken, serviceAccounts};
};
