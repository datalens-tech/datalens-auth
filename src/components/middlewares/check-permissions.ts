import {NextFunction, Request, Response} from '@gravity-ui/expresskit';

import {AUTH_ERROR} from '../../constants/error-constants';
import {Permission} from '../../constants/permission';
import {RouteCheck} from '../../constants/route';
import {introspectUserPermission} from '../../services/permissions/introspect-user-permission';
import {absurd} from '../../utils/absurd';
import {checkPermission as checkPermissionFunc} from '../../utils/permission';

export const checkPermissions = async (req: Request, res: Response, next: NextFunction) => {
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

        if (permission === Permission.Manage) {
            const user = req.ctx.get('user');
            if (!user) {
                req.ctx.logError('User not found');
                res.status(403).send({
                    message: 'User not found',
                    code: AUTH_ERROR.ACCESS_DENIED,
                });
                return;
            }
            const hasPermission = await introspectUserPermission(
                {ctx: req.ctx},
                {userId: user.userId, permission},
            );

            if (!hasPermission) {
                req.ctx.logError('Introspect user permission failed');
                res.status(403).send({
                    message: 'You do not have a sufficient permission for this operation',
                    code: AUTH_ERROR.ACCESS_DENIED,
                });
                return;
            }
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
