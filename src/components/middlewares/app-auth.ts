import {NextFunction, Request, Response} from '@gravity-ui/expresskit';

import {JwtAuth} from '../jwt-auth';

export const appAuth = async (req: Request, res: Response, next: NextFunction) => {
    req.ctx.log('AUTH');

    const {authorization} = req.headers;

    if (authorization) {
        const accessToken = authorization.slice(7);

        if (accessToken) {
            try {
                req.ctx.log('CHECK_ACCESS_TOKEN');

                const {userId, sessionId} = JwtAuth.verifyAccessToken({ctx: req.ctx, accessToken});

                req.originalContext.set('user', {
                    userId,
                    sessionId,
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
