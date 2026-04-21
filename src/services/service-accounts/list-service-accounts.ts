import pick from 'lodash/pick';

import {UserRole} from '../../constants/role';
import {ServiceAccountModel, ServiceAccountModelColumn} from '../../db/models/service-account';
import {
    ServiceAccountRoleModel,
    ServiceAccountRoleModelColumn,
} from '../../db/models/service-account-role';
import type {BigIntId} from '../../db/types/id';
import type {ModelInstance} from '../../db/types/model';
import {getReplica} from '../../db/utils/db';
import {getNextPageToken} from '../../db/utils/query';
import {ServiceArgs} from '../../types/service';
import type {ArrayElement, NullableValues} from '../../utils/utility-types';

const selectedServiceAccountColumns = [
    ServiceAccountModelColumn.ServiceAccountId,
    ServiceAccountModelColumn.Name,
    ServiceAccountModelColumn.Description,
    ServiceAccountModelColumn.CreatedAt,
    ServiceAccountModelColumn.UpdatedAt,
] as const;

const selectedRoleColumns = [ServiceAccountRoleModelColumn.Role] as const;

const selectedJoinedColumns = [
    ...selectedServiceAccountColumns.map((col) => `${ServiceAccountModel.tableName}.${col}`),
    ...selectedRoleColumns.map((col) => `${ServiceAccountRoleModel.tableName}.${col}`),
];

type SelectedServiceAccountColumns = Pick<
    ServiceAccountModel,
    ArrayElement<typeof selectedServiceAccountColumns>
>;

type JoinedColumns = SelectedServiceAccountColumns &
    NullableValues<Pick<ServiceAccountRoleModel, ArrayElement<typeof selectedRoleColumns>>>;

type JoinedServiceAccountRoleModel = ModelInstance<JoinedColumns>;

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

    const result = (await ServiceAccountModel.query(getReplica(trx))
        .select(selectedJoinedColumns)
        .leftJoin(
            ServiceAccountRoleModel.tableName,
            `${ServiceAccountModel.tableName}.${ServiceAccountModelColumn.ServiceAccountId}`,
            `${ServiceAccountRoleModel.tableName}.${ServiceAccountRoleModelColumn.ServiceAccountId}`,
        )
        .whereIn(
            `${ServiceAccountModel.tableName}.${ServiceAccountModelColumn.ServiceAccountId}`,
            (builder) => {
                builder
                    .distinct(
                        `${ServiceAccountModel.tableName}.${ServiceAccountModelColumn.ServiceAccountId}`,
                    )
                    .from(ServiceAccountModel.tableName)
                    .leftJoin(
                        ServiceAccountRoleModel.tableName,
                        `${ServiceAccountModel.tableName}.${ServiceAccountModelColumn.ServiceAccountId}`,
                        `${ServiceAccountRoleModel.tableName}.${ServiceAccountRoleModelColumn.ServiceAccountId}`,
                    )
                    .orderBy(
                        `${ServiceAccountModel.tableName}.${ServiceAccountModelColumn.ServiceAccountId}`,
                    )
                    .limit(pageSize)
                    .offset(pageSize * page);
            },
        )
        .orderBy(`${ServiceAccountModel.tableName}.${ServiceAccountModelColumn.ServiceAccountId}`)
        .timeout(
            ServiceAccountModel.DEFAULT_QUERY_TIMEOUT,
        )) as unknown as JoinedServiceAccountRoleModel[];

    const serviceAccountIdToServiceAccount: Record<BigIntId, ResultServiceAccount> = {};
    const serviceAccountIdsOrder: BigIntId[] = [];

    for (const item of result) {
        const role = item.role;

        if (item.serviceAccountId in serviceAccountIdToServiceAccount) {
            const resultServiceAccount = serviceAccountIdToServiceAccount[item.serviceAccountId];
            serviceAccountIdToServiceAccount[item.serviceAccountId] = {
                ...resultServiceAccount,
                roles: role ? [...resultServiceAccount.roles, role] : resultServiceAccount.roles,
            };
        } else {
            serviceAccountIdsOrder.push(item.serviceAccountId);
            serviceAccountIdToServiceAccount[item.serviceAccountId] = {
                ...pick(item, selectedServiceAccountColumns),
                roles: role ? [role] : [],
            };
        }
    }

    const serviceAccounts = serviceAccountIdsOrder.map(
        (serviceAccountId) => serviceAccountIdToServiceAccount[serviceAccountId],
    );

    const nextPageToken = getNextPageToken({
        page,
        pageSize,
        curPage: serviceAccounts,
    });

    ctx.log('LIST_SERVICE_ACCOUNTS_SUCCESS');

    return {nextPageToken, serviceAccounts};
};
