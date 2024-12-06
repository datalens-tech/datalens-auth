import {NextFunction, Request, Response} from '@gravity-ui/expresskit';

import {DEV_USER} from '../../constants/user';

export const setCiEnv = (_req: Request, res: Response, next: NextFunction) => {
    res.locals.userId = DEV_USER.ID;
    res.locals.login = DEV_USER.LOGIN;

    next();
};
