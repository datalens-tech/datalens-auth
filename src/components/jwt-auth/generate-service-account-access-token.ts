import {AppContext} from '@gravity-ui/nodekit';
import jwt from 'jsonwebtoken';

import type {BigIntId} from '../../db/types/id';
import {ServiceAccountAccessTokenPayload} from '../../types/token';
import {encodeId} from '../../utils/ids';

const algorithm = 'PS256';

export const generateServiceAccountAccessToken = (
    {ctx}: {ctx: AppContext},
    {
        serviceAccountId,
        roles,
    }: {serviceAccountId: BigIntId; roles: ServiceAccountAccessTokenPayload['roles']},
) => {
    ctx.log('GENERATE_SA_ACCESS_TOKEN', {serviceAccountId});

    const encodedServiceAccountId = encodeId(serviceAccountId);

    return jwt.sign(
        {
            serviceAccountId: encodedServiceAccountId,
            roles,
            type: 'service_account',
        },
        ctx.config.tokenPrivateKey,
        {algorithm, expiresIn: `${ctx.config.serviceAccountAccessTokenTTL}s`},
    );
};
