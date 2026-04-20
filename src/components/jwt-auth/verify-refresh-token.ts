import {AppContext} from '@gravity-ui/nodekit';
import jwt from 'jsonwebtoken';

import {RefreshTokenPayload} from '../../types/token';

const algorithm = 'PS256';

export const verifyRefreshToken = ({
    ctx,
    refreshToken,
}: {
    ctx: AppContext;
    refreshToken: string;
}): RefreshTokenPayload => {
    ctx.log('VERIFY_REFRESH_TOKEN');

    try {
        const result = jwt.verify(refreshToken, ctx.config.tokenPublicKey, {
            algorithms: [algorithm],
        }) as RefreshTokenPayload;
        ctx.log('VERIFY_REFRESH_TOKEN_SUCCESS');
        return result;
    } catch (err) {
        ctx.logError('VERIFY_REFRESH_TOKEN_ERROR', err);
        throw err;
    }
};
