import {NextFunction, Request, Response} from '@gravity-ui/expresskit';

import {Feature, isEnabledFeature} from '../features';

export const ctx = async (req: Request, res: Response, next: NextFunction) => {
    const {userId, login, isPrivateRoute = false} = res.locals;

    const user = {userId, login};

    req.originalContext.set('info', {
        requestId: req.id,
        isPrivateRoute,
        readOnlyMode: isEnabledFeature(req.ctx, Feature.ReadOnlyMode),
        user,
    });

    req.ctx.log('REQUEST_INFO', {
        requestedBy: user,
    });

    next();
};
