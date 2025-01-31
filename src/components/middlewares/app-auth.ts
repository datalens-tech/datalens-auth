import {NextFunction, Request, Response} from '@gravity-ui/expresskit';

import {AUTHORIZATION_HEADER, AUTHORIZATION_HEADER_VALUE_PREFIX} from '../../constants/header';
import {decodeId} from '../../utils/ids';
import {JwtAuth} from '../jwt-auth';

export const appAuth = async (req: Request, res: Response, next: NextFunction) => {
    req.ctx.log('AUTH');

    const authorization = req.headers[AUTHORIZATION_HEADER];

    if (authorization) {
        const accessToken = authorization.slice(AUTHORIZATION_HEADER_VALUE_PREFIX.length + 1);

        if (accessToken) {
            try {
                req.ctx.log('CHECK_ACCESS_TOKEN');

                const {userId, sessionId, roles} = JwtAuth.verifyAccessToken({
                    ctx: req.ctx,
                    accessToken,
                });

                req.originalContext.set('user', {
                    userId: decodeId(userId),
                    sessionId: decodeId(sessionId),
                    roles,
                });

                req.ctx.log('CHECK_ACCESS_TOKEN_SUCCESS');

                next();
                return;
            } catch (err) {
                req.ctx.logError('CHECK_ACCESS_TOKEN_ERROR', err);
            }
        }
    }

    res.status(401).send('Unauthorized access');
};
