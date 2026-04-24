import {AppContext} from '@gravity-ui/nodekit';
import jwt from 'jsonwebtoken';

import {ACCESS_TOKEN_TYPE} from '../../constants/token';
import type {BigIntId} from '../../db/types/id';
import {ServiceAccountAccessTokenClaims, ServiceAccountAccessTokenPayload} from '../../types/token';
import {encodeId} from '../../utils/ids';

import {SIGNATURE_ALGORITHM} from './constants';

export const generateServiceAccountAccessToken = (
    {ctx}: {ctx: AppContext},
    {
        serviceAccountId,
        roles,
    }: {serviceAccountId: BigIntId; roles: ServiceAccountAccessTokenPayload['roles']},
): string => {
    ctx.log('GENERATE_SA_ACCESS_TOKEN', {serviceAccountId});

    const encodedServiceAccountId = encodeId(serviceAccountId);

    const payload: ServiceAccountAccessTokenClaims = {
        userId: encodedServiceAccountId,
        roles,
        type: ACCESS_TOKEN_TYPE.SERVICE_ACCOUNT,
    };

    return jwt.sign(payload, ctx.config.tokenPrivateKey, {
        algorithm: SIGNATURE_ALGORITHM,
        expiresIn: `${ctx.config.serviceAccountAccessTokenTTL}s`,
    });
};
