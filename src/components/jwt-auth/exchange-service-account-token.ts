import {AppError} from '@gravity-ui/nodekit';
import jwt from 'jsonwebtoken';

import {AUTH_ERROR} from '../../constants/error-constants';
import {
    ServiceAccountKeyModel,
    ServiceAccountKeyModelColumn,
} from '../../db/models/service-account-key';
import {
    ServiceAccountRoleModel,
    ServiceAccountRoleModelColumn,
} from '../../db/models/service-account-role';
import type {BigIntId, StringId} from '../../db/types/id';
import {getPrimary} from '../../db/utils/db';
import {ServiceArgs} from '../../types/service';
import {decodeId} from '../../utils/ids';

import {SIGNATURE_ALGORITHM} from './constants';
import {generateServiceAccountAccessToken} from './generate-service-account-access-token';

const MAX_CLIENT_JWT_TTL_SECONDS = 600;

const resolveVerifiedPayload = async (
    {trx, ctx}: ServiceArgs,
    {
        clientJwt,
        kid,
        serviceAccountId,
    }: {clientJwt: string; kid: string; serviceAccountId: BigIntId},
): Promise<jwt.JwtPayload> => {
    const invalidJwt = (message: string) =>
        new AppError(message, {code: AUTH_ERROR.INVALID_SERVICE_ACCOUNT_JWT});

    let decodedKeyId: BigIntId;
    try {
        decodedKeyId = decodeId(kid as StringId);
    } catch (err) {
        ctx.logError('EXCHANGE_SA_TOKEN_KID_DECODE_ERROR', err);
        throw invalidJwt('Invalid kid in client JWT header');
    }

    const key = await ServiceAccountKeyModel.query(getPrimary(trx))
        .select(ServiceAccountKeyModelColumn.PublicKey)
        .where(ServiceAccountKeyModelColumn.KeyId, decodedKeyId)
        .where(ServiceAccountKeyModelColumn.ServiceAccountId, serviceAccountId)
        .first()
        .timeout(ServiceAccountKeyModel.DEFAULT_QUERY_TIMEOUT);

    if (!key) {
        throw new AppError(AUTH_ERROR.SERVICE_ACCOUNT_KEY_NOT_EXISTS, {
            code: AUTH_ERROR.SERVICE_ACCOUNT_KEY_NOT_EXISTS,
        });
    }

    try {
        return jwt.verify(clientJwt, key.publicKey, {
            algorithms: [SIGNATURE_ALGORITHM],
        }) as jwt.JwtPayload;
    } catch {
        ctx.logError('EXCHANGE_SA_TOKEN_VERIFY_ERROR', new Error('Key verification failed'));
        throw invalidJwt('Client JWT signature verification failed');
    }
};

export const exchangeServiceAccountToken = async (
    {trx, ctx}: ServiceArgs,
    {clientJwt}: {clientJwt: string},
) => {
    ctx.log('EXCHANGE_SA_TOKEN');

    const invalidJwt = (message: string) =>
        new AppError(message, {code: AUTH_ERROR.INVALID_SERVICE_ACCOUNT_JWT});

    let decoded: jwt.Jwt | null;
    try {
        decoded = jwt.decode(clientJwt, {complete: true});
    } catch (err) {
        ctx.logError('EXCHANGE_SA_TOKEN_DECODE_ERROR', err);
        throw invalidJwt('Malformed client JWT');
    }

    if (!decoded) {
        ctx.logError('EXCHANGE_SA_DECODED_TOKEN_EMPTY');
        throw invalidJwt('Malformed client JWT');
    }

    const rawPayload =
        decoded?.payload && typeof decoded.payload === 'object' ? decoded.payload : null;
    const iss = rawPayload ? (rawPayload as {iss?: unknown}).iss : undefined;

    if (typeof iss !== 'string' || iss.length === 0) {
        throw invalidJwt('Missing or invalid iss claim in client JWT');
    }

    let decodedServiceAccountId: BigIntId;
    try {
        decodedServiceAccountId = decodeId(iss as StringId);
    } catch (err) {
        ctx.logError('EXCHANGE_SA_TOKEN_ISS_DECODE_ERROR', err);
        throw invalidJwt('Invalid iss claim in client JWT');
    }

    const roles = await ServiceAccountRoleModel.query(getPrimary(trx))
        .select(ServiceAccountRoleModelColumn.Role)
        .where(ServiceAccountRoleModelColumn.ServiceAccountId, decodedServiceAccountId)
        .timeout(ServiceAccountRoleModel.DEFAULT_QUERY_TIMEOUT);

    const rawKid =
        decoded?.header && typeof decoded.header === 'object'
            ? (decoded.header as {kid?: unknown}).kid
            : undefined;

    if (typeof rawKid !== 'string' || rawKid.length === 0) {
        throw invalidJwt('Missing or invalid kid in client JWT header');
    }

    const payload = await resolveVerifiedPayload(
        {trx, ctx},
        {clientJwt, kid: rawKid, serviceAccountId: decodedServiceAccountId},
    );

    if (typeof payload.iat !== 'number' || typeof payload.exp !== 'number') {
        throw invalidJwt('Client JWT must contain numeric iat and exp claims');
    }

    if (payload.exp - payload.iat > MAX_CLIENT_JWT_TTL_SECONDS) {
        throw invalidJwt(`Client JWT TTL exceeds ${MAX_CLIENT_JWT_TTL_SECONDS} seconds`);
    }

    ctx.log('EXCHANGE_SA_TOKEN_SUCCESS', {serviceAccountId: decodedServiceAccountId});

    return generateServiceAccountAccessToken(
        {ctx},
        {serviceAccountId: decodedServiceAccountId, roles: roles.map((r) => r.role)},
    );
};
