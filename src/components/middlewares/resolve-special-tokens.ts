import {NextFunction, Request, Response} from '@gravity-ui/expresskit';

import {MASTER_TOKEN_HEADER} from '../../constants/header';
import type {Optional} from '../../utils/utility-types';

function resolvePrivateRoute(req: Request, res: Response, next: NextFunction) {
    req.ctx.log('PRIVATE_API_CALL');

    const masterToken = req.ctx.config.masterToken;

    if (!masterToken || masterToken.length === 0) {
        res.status(403).send({error: 'No master token in config'});
        return;
    }

    const requestMasterToken = req.headers[MASTER_TOKEN_HEADER] as Optional<string>;

    if (!requestMasterToken || !masterToken.includes(requestMasterToken)) {
        req.ctx.log('PRIVATE_API_CALL_DENIED');

        res.status(403).send({error: 'Private API call denied'});
        return;
    }

    req.ctx.log('PRIVATE_API_CALL_AUTHORIZED');

    res.locals.isPrivateRoute = true;
    next();
}

export const resolveSpecialTokens = async (req: Request, res: Response, next: NextFunction) => {
    if (req.routeInfo.private) {
        resolvePrivateRoute(req, res, next);
    } else {
        next();
    }
};
