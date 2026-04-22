import {NextFunction, Request, Response} from '@gravity-ui/expresskit';

import {AUTH_ERROR} from '../../constants/error-constants';
import {Permission} from '../../constants/permission';
import {RouteCheck} from '../../constants/route';
import {introspectSubjectPermission} from '../../services/permissions/introspect-subject-permission';
import {absurd} from '../../utils/absurd';
import {checkPermission as checkPermissionFunc} from '../../utils/permission';

export const checkPermissions = async (req: Request, res: Response, next: NextFunction) => {
    const permission = req.routeInfo.permission;
    const check = req.routeInfo.check;
    const userOnly = req.routeInfo.userOnly;

    const subject = req.ctx.get('subject');

    if (userOnly && subject?.type !== 'user') {
        req.ctx.logError(`${subject?.type} subject type is not allowed on this endpoint`);
        res.status(403).send({
            message: 'You do not have a sufficient permission for this operation',
            code: AUTH_ERROR.ACCESS_DENIED,
        });
        return;
    }

    if (permission) {
        if (!subject) {
            req.ctx.logError('Subject not found');
            res.status(403).send({
                message: 'Subject not found',
                code: AUTH_ERROR.ACCESS_DENIED,
            });
            return;
        }

        const userRoles = subject.roles;

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
            const hasPermission = await introspectSubjectPermission(
                {ctx: req.ctx},
                subject,
                permission,
            );

            if (!hasPermission) {
                req.ctx.logError('Introspect permission failed');
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
