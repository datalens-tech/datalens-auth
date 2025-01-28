import {NextFunction, Request, Response} from '@gravity-ui/expresskit';

import {AUTH_ERROR} from '../../constants/error-constants';
import {checkPermission as checkPermissionFunc} from '../../utils/permission';

export const checkPermissions = (req: Request, res: Response, next: NextFunction) => {
    const permission = req.routeInfo.permission;

    if (permission) {
        const userRoles = req.ctx.get('user')?.roles || [];
        if (
            userRoles.length === 0 ||
            userRoles.every((role) => checkPermissionFunc({role, permission}) === false)
        ) {
            req.ctx.logError('Check route permission failed');
            res.status(403).send({
                message: 'You do not have a sufficient permission for this operation',
                code: AUTH_ERROR.ACCESS_DENIED,
            });
            return;
        }
    }

    next();
};
