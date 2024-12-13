import {NextFunction, Request, Response} from '@gravity-ui/expresskit';

import {Feature, isEnabledFeature} from '../features';

export const ctx = async (req: Request, res: Response, next: NextFunction) => {
    const {isPrivateRoute = false} = res.locals;

    req.originalContext.set('info', {
        isPrivateRoute,
        readOnlyMode: isEnabledFeature(req.ctx, Feature.ReadOnlyMode),
    });

    // req.ctx.log('REQUEST_INFO', {});

    next();
};
