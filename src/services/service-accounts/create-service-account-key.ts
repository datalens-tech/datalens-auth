import {generateKeyPair} from 'node:crypto';
import {promisify} from 'node:util';

import {AppError} from '@gravity-ui/nodekit';

import {AUTH_ERROR} from '../../constants/error-constants';
import {USER_TYPE} from '../../constants/user';
import {ServiceAccountKeyModel} from '../../db/models/service-account-key';
import {UserModel, UserModelColumn} from '../../db/models/user';
import type {BigIntId} from '../../db/types/id';
import {getPrimary, getReplica} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';

const generateKeyPairAsync = promisify(generateKeyPair);

export type CreateServiceAccountKeyResult = {
    keyId: BigIntId;
    privateKey: string;
};

export const createServiceAccountKey = async (
    {ctx, trx}: ServiceArgs,
    {serviceAccountId}: {serviceAccountId: BigIntId},
): Promise<CreateServiceAccountKeyResult> => {
    const registry = ctx.get('registry');
    const {getId} = registry.getDbInstance();

    ctx.log('CREATE_SERVICE_ACCOUNT_KEY', {serviceAccountId});

    const sa = await UserModel.query(getReplica(trx))
        .select(UserModelColumn.UserId)
        .where(UserModelColumn.UserId, serviceAccountId)
        .where(UserModelColumn.Type, USER_TYPE.SERVICE_ACCOUNT)
        .first()
        .timeout(UserModel.DEFAULT_QUERY_TIMEOUT);

    if (!sa) {
        throw new AppError(AUTH_ERROR.SERVICE_ACCOUNT_NOT_EXISTS, {
            code: AUTH_ERROR.SERVICE_ACCOUNT_NOT_EXISTS,
        });
    }

    const {publicKey, privateKey} = await generateKeyPairAsync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {type: 'spki', format: 'pem'},
        privateKeyEncoding: {type: 'pkcs8', format: 'pem'},
    });

    const keyId = await getId();

    const result = await ServiceAccountKeyModel.query(getPrimary(trx))
        .insert({keyId, serviceAccountId, publicKey})
        .timeout(ServiceAccountKeyModel.DEFAULT_QUERY_TIMEOUT);

    ctx.log('CREATE_SERVICE_ACCOUNT_KEY_SUCCESS', {keyId});

    return {keyId: result.keyId, privateKey};
};
