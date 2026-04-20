import {AppContext} from '@gravity-ui/nodekit';
import jwt from 'jsonwebtoken';

import {VerifiedAccessTokenPayload} from '../../types/token';

const algorithm = 'PS256';

export const verifyAccessToken = ({
    ctx,
    accessToken,
}: {
    ctx: AppContext;
    accessToken: string;
}): VerifiedAccessTokenPayload => {
    ctx.log('VERIFY_ACCESS_TOKEN');

    try {
        const result = jwt.verify(accessToken, ctx.config.tokenPublicKey, {
            algorithms: [algorithm],
        }) as VerifiedAccessTokenPayload;
        ctx.log('VERIFY_ACCESS_TOKEN_SUCCESS');
        return result;
    } catch (err) {
        ctx.logError('VERIFY_ACCESS_TOKEN_ERROR', err);
        throw err;
    }
};
