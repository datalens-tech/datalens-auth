import {AppMiddleware, AppRouteDescription, AuthPolicy} from '@gravity-ui/expresskit';
import type {HttpMethod} from '@gravity-ui/expresskit/dist/types';
import type {NodeKit} from '@gravity-ui/nodekit';
import passport from 'passport';

import {Feature} from './components/features';
import {AUTHORIZATION_HEADER} from './constants/header';
import {Permission} from './constants/permission';
import {RouteCheck} from './constants/route';
import authController from './controllers/auth';
import healthcheckController from './controllers/healthcheck';
import homeController from './controllers/home';
import managementController from './controllers/management';
import usersController from './controllers/users';

export type GetRoutesOptions = {
    beforeAuth: AppMiddleware[];
    afterAuth: AppMiddleware[];
};

export type ExtendedAppRouteDescription<F = Feature> = AppRouteDescription & {
    route: `${Uppercase<HttpMethod>} ${string}`;
    features?: F[];
};

// eslint-disable-next-line complexity
export function getRoutes(_nodekit: NodeKit, options: GetRoutesOptions) {
    const makeRoute = (
        routeDescription: ExtendedAppRouteDescription,
    ): ExtendedAppRouteDescription => ({
        ...options,
        ...routeDescription,
    });

    const routes = {
        home: makeRoute({
            route: 'GET /',
            handler: homeController,
        }),

        ping: {
            route: 'GET /ping',
            handler: healthcheckController.ping,
            authPolicy: AuthPolicy.disabled,
        },
        pingDb: {
            route: 'GET /ping-db',
            handler: healthcheckController.pingDb,
            authPolicy: AuthPolicy.disabled,
        },
        pingDbPrimary: {
            route: 'GET /ping-db-primary',
            handler: healthcheckController.pingDbPrimary,
            authPolicy: AuthPolicy.disabled,
        },
        pool: {
            route: 'GET /pool',
            handler: healthcheckController.pool,
            authPolicy: AuthPolicy.disabled,
        },

        signinFail: {
            route: 'GET /signin-fail',
            handler: (_req, res) => {
                res.status(403).send({message: 'Forbidden'});
            },
            authPolicy: AuthPolicy.disabled,
        },
        signin: {
            route: 'POST /signin',
            handler: authController.signin,
            authHandler: passport.authenticate('local', {
                failureRedirect: '/signin-fail',
                session: false,
            }),
            write: true,
        },
        signup: makeRoute({
            route: 'POST /signup',
            handler: authController.signup,
            authPolicy: AuthPolicy.disabled,
            write: true,
            check: [RouteCheck.ManageLocalUsers],
        }),
        logout: makeRoute({
            route: 'GET /logout',
            handler: authController.logout,
            authPolicy: AuthPolicy.disabled,
            write: true,
        }),
        refresh: makeRoute({
            route: 'POST /refresh',
            handler: authController.refresh,
            authPolicy: AuthPolicy.disabled,
            write: true,
        }),

        addUsersRoles: makeRoute({
            route: 'POST /v1/management/users/roles/add',
            handler: managementController.addUsersRoles,
            write: true,
            apiHeaders: [AUTHORIZATION_HEADER],
            permission: Permission.Manage,
            check: [RouteCheck.ManageLocalUsers],
        }),
        privateAddUsersRoles: makeRoute({
            route: 'POST /private/v1/management/users/roles/add',
            handler: managementController.addUsersRoles,
            write: true,
            private: true,
            authPolicy: AuthPolicy.disabled,
        }),
        updateUsersRoles: makeRoute({
            route: 'POST /v1/management/users/roles/update',
            handler: managementController.updateUsersRoles,
            write: true,
            apiHeaders: [AUTHORIZATION_HEADER],
            permission: Permission.Manage,
            check: [RouteCheck.ManageLocalUsers],
        }),
        privateUpdateUsersRoles: makeRoute({
            route: 'POST /private/v1/management/users/roles/update',
            handler: managementController.updateUsersRoles,
            write: true,
            private: true,
            authPolicy: AuthPolicy.disabled,
        }),
        removeUsersRoles: makeRoute({
            route: 'POST /v1/management/users/roles/remove',
            handler: managementController.removeUsersRoles,
            write: true,
            apiHeaders: [AUTHORIZATION_HEADER],
            permission: Permission.Manage,
            check: [RouteCheck.ManageLocalUsers],
        }),
        privateRemoveUsersRoles: makeRoute({
            route: 'POST /private/v1/management/users/roles/remove',
            handler: managementController.removeUsersRoles,
            write: true,
            private: true,
            authPolicy: AuthPolicy.disabled,
        }),
        createUser: makeRoute({
            route: 'POST /v1/management/users/create',
            handler: managementController.createUser,
            write: true,
            apiHeaders: [AUTHORIZATION_HEADER],
            permission: Permission.Manage,
            check: [RouteCheck.ManageLocalUsers],
        }),
        privateCreateUser: makeRoute({
            route: 'POST /private/v1/management/users/create',
            handler: managementController.createUser,
            write: true,
            private: true,
            authPolicy: AuthPolicy.disabled,
        }),
        deleteUser: makeRoute({
            route: 'DELETE /v1/management/users/:userId',
            handler: managementController.deleteUser,
            write: true,
            apiHeaders: [AUTHORIZATION_HEADER],
            permission: Permission.Manage,
            check: [RouteCheck.ManageLocalUsers],
        }),
        privateDeleteUser: makeRoute({
            route: 'DELETE /private/v1/management/users/:userId',
            handler: managementController.deleteUser,
            write: true,
            private: true,
            authPolicy: AuthPolicy.disabled,
        }),
        getUserProfile: makeRoute({
            route: 'GET /v1/management/users/:userId/profile',
            handler: managementController.getUserProfile,
            apiHeaders: [AUTHORIZATION_HEADER],
            permission: Permission.Manage,
        }),
        updateUserProfile: makeRoute({
            route: 'POST /v1/management/users/:userId/profile',
            handler: managementController.updateUserProfile,
            write: true,
            apiHeaders: [AUTHORIZATION_HEADER],
            permission: Permission.Manage,
            check: [RouteCheck.ManageLocalUsers],
        }),
        privateUpdateUserProfile: makeRoute({
            route: 'POST /private/v1/management/users/:userId/profile',
            handler: managementController.updateUserProfile,
            write: true,
            private: true,
            authPolicy: AuthPolicy.disabled,
        }),
        updateUserPassword: makeRoute({
            route: 'POST /v1/management/users/:userId/password',
            handler: managementController.updateUserPassword,
            write: true,
            apiHeaders: [AUTHORIZATION_HEADER],
            permission: Permission.Manage,
            check: [RouteCheck.ManageLocalUsers],
        }),
        privateUpdateUserPassword: makeRoute({
            route: 'POST /private/v1/management/users/:userId/password',
            handler: managementController.updateUserPassword,
            write: true,
            private: true,
            authPolicy: AuthPolicy.disabled,
        }),

        getUsersList: makeRoute({
            route: 'GET /v1/users/list',
            handler: usersController.getUsersList,
            apiHeaders: [AUTHORIZATION_HEADER],
            permission: Permission.InstanceUse,
        }),
        getUsersByIds: makeRoute({
            route: 'POST /v1/users/get-by-ids',
            handler: usersController.getUsersByIds,
            apiHeaders: [AUTHORIZATION_HEADER],
            permission: Permission.InstanceUse,
        }),
        getMyUserProfile: makeRoute({
            route: 'GET /v1/users/me/profile',
            handler: usersController.getUserProfile,
            apiHeaders: [AUTHORIZATION_HEADER],
        }),
        updateMyUserProfile: makeRoute({
            route: 'POST /v1/users/me/profile',
            handler: usersController.updateUserProfile,
            write: true,
            apiHeaders: [AUTHORIZATION_HEADER],
            check: [RouteCheck.ManageLocalUsers],
        }),
        updateMyUserPassword: makeRoute({
            route: 'POST /v1/users/me/password',
            handler: usersController.updateUserPassword,
            write: true,
            apiHeaders: [AUTHORIZATION_HEADER],
            check: [RouteCheck.ManageLocalUsers],
        }),
    } satisfies Record<string, ExtendedAppRouteDescription>;

    const typedRoutes: {[key in keyof typeof routes]: ExtendedAppRouteDescription} = routes;
    return typedRoutes;
}
