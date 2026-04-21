import {AppError} from '@gravity-ui/nodekit';
import {transaction} from 'objection';

import {AUTH_ERROR} from '../../constants/error-constants';
import {UserRole} from '../../constants/role';
import {ServiceAccountModel, ServiceAccountModelColumn} from '../../db/models/service-account';
import {
    ServiceAccountRoleModel,
    ServiceAccountRoleModelColumn,
} from '../../db/models/service-account-role';
import {getPrimary, getReplica} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';
import {Optional} from '../../utils/utility-types';

export type CreateServiceAccountArgs = {
    name: string;
    description: Optional<string>;
    roles: Optional<UserRole[]>;
};

export const createServiceAccount = async (
    {ctx, trx}: ServiceArgs,
    args: CreateServiceAccountArgs,
): Promise<ServiceAccountModel> => {
    const {name, description, roles} = args;

    const registry = ctx.get('registry');
    const {getId} = registry.getDbInstance();

    ctx.log('CREATE_SERVICE_ACCOUNT', {name});

    const existing = await ServiceAccountModel.query(getReplica(trx))
        .select(ServiceAccountModelColumn.ServiceAccountId)
        .where(ServiceAccountModelColumn.Name, name)
        .first()
        .timeout(ServiceAccountModel.DEFAULT_QUERY_TIMEOUT);

    if (existing) {
        throw new AppError(AUTH_ERROR.SERVICE_ACCOUNT_NAME_EXISTS, {
            code: AUTH_ERROR.SERVICE_ACCOUNT_NAME_EXISTS,
        });
    }

    const serviceAccountId = await getId();

    const result = await transaction(getPrimary(trx), async (transactionTrx) => {
        const createdServiceAccount = await ServiceAccountModel.query(transactionTrx)
            .insert({
                [ServiceAccountModelColumn.ServiceAccountId]: serviceAccountId,
                [ServiceAccountModelColumn.Name]: name,
                [ServiceAccountModelColumn.Description]: description,
            })
            .timeout(ServiceAccountModel.DEFAULT_QUERY_TIMEOUT);

        const resultRoles = (Array.isArray(roles) ? roles : [ctx.config.defaultRole]).filter(
            Boolean,
        );

        if (resultRoles.length) {
            const normalizedRoles = Array.from(new Set(resultRoles));
            await ServiceAccountRoleModel.query(transactionTrx)
                .insert(
                    normalizedRoles.map((role) => ({
                        [ServiceAccountRoleModelColumn.ServiceAccountId]: serviceAccountId,
                        [ServiceAccountRoleModelColumn.Role]: role,
                    })),
                )
                .timeout(ServiceAccountRoleModel.DEFAULT_QUERY_TIMEOUT);
        }

        return createdServiceAccount;
    });

    ctx.log('CREATE_SERVICE_ACCOUNT_SUCCESS', {serviceAccountId});

    return result;
};
