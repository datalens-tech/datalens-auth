import {NextFunction, Request, Response} from '@gravity-ui/expresskit';

import {AUTHORIZATION_HEADER, AUTHORIZATION_HEADER_VALUE_PREFIX} from '../../constants/header';
import {ACCESS_TOKEN_TYPE} from '../../constants/token';
import {decodeId} from '../../utils/ids';
import {verifyAccessToken} from '../jwt-auth';

export const appAuth = async (req: Request, res: Response, next: NextFunction) => {
    req.ctx.log('AUTH');

    const authorization = req.headers[AUTHORIZATION_HEADER];

    if (authorization) {
        const accessToken = authorization.slice(AUTHORIZATION_HEADER_VALUE_PREFIX.length + 1);

        if (accessToken) {
            try {
                req.ctx.log('CHECK_ACCESS_TOKEN');

                const payload = verifyAccessToken({ctx: req.ctx, accessToken});

                if (payload.type === ACCESS_TOKEN_TYPE.SERVICE_ACCOUNT) {
                    req.originalContext.set('subject', {
                        type: ACCESS_TOKEN_TYPE.SERVICE_ACCOUNT,
                        subjectId: decodeId(payload.userId),
                        sessionId: null,
                        roles: payload.roles,
                        accessToken,
                    });
                } else {
                    req.originalContext.set('subject', {
                        type: ACCESS_TOKEN_TYPE.USER,
                        subjectId: decodeId(payload.userId),
                        sessionId: decodeId(payload.sessionId),
                        roles: payload.roles,
                        accessToken,
                    });
                }

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
