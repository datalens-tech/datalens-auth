import {AppContext} from '@gravity-ui/nodekit';
import jwt from 'jsonwebtoken';

import {VerifiedAccessTokenPayload} from '../../types/token';

import {SIGNATURE_ALGORITHM} from './constants';

export const verifyAccessToken = ({ctx, accessToken}: {ctx: AppContext; accessToken: string}) => {
    ctx.log('VERIFY_ACCESS_TOKEN');

    try {
        const result = jwt.verify(accessToken, ctx.config.tokenPublicKey, {
            algorithms: [SIGNATURE_ALGORITHM],
        }) as VerifiedAccessTokenPayload;
        ctx.log('VERIFY_ACCESS_TOKEN_SUCCESS');
        return result;
    } catch (err) {
        ctx.logError('VERIFY_ACCESS_TOKEN_ERROR', err);
        throw err;
    }
};
