import {NextFunction, Request, Response} from '@gravity-ui/expresskit';

import {AUTH_ERROR} from '../../constants/error-constants';
import {RouteCheck} from '../../constants/route';
import {absurd} from '../../utils/absurd';
import {checkPermission as checkPermissionFunc} from '../../utils/permission';

export const checkPermissions = (req: Request, res: Response, next: NextFunction) => {
    const permission = req.routeInfo.permission;
    const check = req.routeInfo.check;

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

    if (Array.isArray(check)) {
        for (const checkRoute of check) {
            switch (checkRoute) {
                case RouteCheck.ManageLocalUsers: {
                    if (req.ctx.config.manageLocalUsersDisabled) {
                        req.ctx.logError(`Check route '${checkRoute}' failed`);
                        res.status(403).send({
                            message: 'Local user management is disabled',
                            code: AUTH_ERROR.MANAGE_LOCAL_USERS_DISABLED,
                        });
                        return;
                    }
                    break;
                }
                case RouteCheck.SignupDisabled: {
                    if (req.ctx.config.signupDisabled) {
                        req.ctx.logError(`Check route '${checkRoute}' failed`);
                        res.status(403).send({
                            message: 'Signup is disabled',
                            code: AUTH_ERROR.SIGNUP_DISABLED,
                        });
                        return;
                    }
                    break;
                }
                default:
                    absurd(checkRoute);
            }
        }
    }

    next();
};
