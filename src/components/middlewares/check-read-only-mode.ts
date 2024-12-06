import {NextFunction, Request, Response} from '@gravity-ui/expresskit';

import {AUTH_ERROR, READ_ONLY_MODE_CODE} from '../../constants/error-constants';
import {Feature, isEnabledFeature} from '../features';

export const checkReadOnlyMode = (req: Request, res: Response, next: NextFunction) => {
    const readOnlyMode = isEnabledFeature(req.ctx, Feature.ReadOnlyMode);

    if (readOnlyMode && req.routeInfo.write) {
        req.ctx.logError(AUTH_ERROR.READ_ONLY_MODE_ENABLED);
        res.status(READ_ONLY_MODE_CODE).send({code: AUTH_ERROR.READ_ONLY_MODE_ENABLED});
        return;
    }

    next();
};
