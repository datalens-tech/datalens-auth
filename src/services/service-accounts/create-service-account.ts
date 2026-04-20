import {generateKeyPairSync} from 'node:crypto';

import {AppError} from '@gravity-ui/nodekit';
import type {PartialModelObject} from 'objection';

import {AUTH_ERROR} from '../../constants/error-constants';
import {UserRole} from '../../constants/role';
import {ServiceAccountModel, ServiceAccountModelColumn} from '../../db/models/service-account';
import {getPrimary, getReplica} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';
import {Optional} from '../../utils/utility-types';

export interface CreateServiceAccountArgs {
    name: string;
    description: Optional<string>;
    roles: UserRole[];
}

export const createServiceAccount = async (
    {ctx, trx}: ServiceArgs,
    args: CreateServiceAccountArgs,
) => {
    const {name, description, roles} = args;

    const registry = ctx.get('registry');
    const {getId} = registry.getDbInstance();

    const user = ctx.get('user');
    ctx.log('CREATE_SERVICE_ACCOUNT', {name, actor: user.userId});

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

    const {publicKey, privateKey} = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {type: 'spki', format: 'pem'},
        privateKeyEncoding: {type: 'pkcs8', format: 'pem'},
    });

    const serviceAccountId = await getId();

    const insertData: PartialModelObject<ServiceAccountModel> = {
        serviceAccountId,
        name,
        description,
        publicKey,
        roles,
    };

    const result = await ServiceAccountModel.query(getPrimary(trx))
        .insert(insertData)
        .timeout(ServiceAccountModel.DEFAULT_QUERY_TIMEOUT);

    ctx.log('CREATE_SERVICE_ACCOUNT_SUCCESS', {serviceAccountId});

    return {serviceAccountId: result.serviceAccountId, privateKey};
};
