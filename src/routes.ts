import {AppMiddleware, AppRouteDescription, AuthPolicy} from '@gravity-ui/expresskit';
import type {HttpMethod} from '@gravity-ui/expresskit/dist/types';
import type {NodeKit} from '@gravity-ui/nodekit';
import passport from 'passport';

import {Feature} from './components/features';
import {AUTHORIZATION_HEADER} from './constants/header';
import {Permission} from './constants/permission';
import {RouteCheck} from './constants/route';
import auth from './controllers/auth';
import healthcheckController from './controllers/healthcheck';
import homeController from './controllers/home';
import management from './controllers/management';
import users from './controllers/users';

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
            handler: auth.signinController,
            authHandler: passport.authenticate('local', {
                failureRedirect: '/signin-fail',
                session: false,
            }),
            write: true,
        },
        signup: makeRoute({
            route: 'POST /signup',
            handler: auth.signupController,
            authPolicy: AuthPolicy.disabled,
            write: true,
            check: [RouteCheck.ManageLocalUsers],
        }),
        logout: makeRoute({
            route: 'GET /logout',
            handler: auth.logoutController,
            authPolicy: AuthPolicy.disabled,
            write: true,
        }),
        refresh: makeRoute({
            route: 'POST /refresh',
            handler: auth.refreshController,
            authPolicy: AuthPolicy.disabled,
            write: true,
        }),

        addUsersRoles: makeRoute({
            route: 'POST /v1/management/users/roles/add',
            handler: management.addUsersRolesController,
            write: true,
            apiHeaders: [AUTHORIZATION_HEADER],
            permission: Permission.Manage,
            check: [RouteCheck.ManageLocalUsers],
        }),
        privateAddUsersRoles: makeRoute({
            route: 'POST /private/v1/management/users/roles/add',
            handler: management.addUsersRolesController,
            write: true,
            private: true,
            authPolicy: AuthPolicy.disabled,
        }),
        updateUsersRoles: makeRoute({
            route: 'POST /v1/management/users/roles/update',
            handler: management.updateUsersRolesController,
            write: true,
            apiHeaders: [AUTHORIZATION_HEADER],
            permission: Permission.Manage,
            check: [RouteCheck.ManageLocalUsers],
        }),
        privateUpdateUsersRoles: makeRoute({
            route: 'POST /private/v1/management/users/roles/update',
            handler: management.updateUsersRolesController,
            write: true,
            private: true,
            authPolicy: AuthPolicy.disabled,
        }),
        removeUsersRoles: makeRoute({
            route: 'POST /v1/management/users/roles/remove',
            handler: management.removeUsersRolesController,
            write: true,
            apiHeaders: [AUTHORIZATION_HEADER],
            permission: Permission.Manage,
            check: [RouteCheck.ManageLocalUsers],
        }),
        privateRemoveUsersRoles: makeRoute({
            route: 'POST /private/v1/management/users/roles/remove',
            handler: management.removeUsersRolesController,
            write: true,
            private: true,
            authPolicy: AuthPolicy.disabled,
        }),
        createUser: makeRoute({
            route: 'POST /v1/management/users/create',
            handler: management.createUserController,
            write: true,
            apiHeaders: [AUTHORIZATION_HEADER],
            permission: Permission.Manage,
            check: [RouteCheck.ManageLocalUsers],
        }),
        privateCreateUser: makeRoute({
            route: 'POST /private/v1/management/users/create',
            handler: management.createUserController,
            write: true,
            private: true,
            authPolicy: AuthPolicy.disabled,
        }),
        deleteUser: makeRoute({
            route: 'DELETE /v1/management/users/:userId',
            handler: management.deleteUserController,
            write: true,
            apiHeaders: [AUTHORIZATION_HEADER],
            permission: Permission.Manage,
            check: [RouteCheck.ManageLocalUsers],
        }),
        privateDeleteUser: makeRoute({
            route: 'DELETE /private/v1/management/users/:userId',
            handler: management.deleteUserController,
            write: true,
            private: true,
            authPolicy: AuthPolicy.disabled,
        }),
        getUserProfile: makeRoute({
            route: 'GET /v1/management/users/:userId/profile',
            handler: management.getUserProfileController,
            apiHeaders: [AUTHORIZATION_HEADER],
            permission: Permission.Manage,
        }),
        updateUserProfile: makeRoute({
            route: 'POST /v1/management/users/:userId/profile',
            handler: management.updateUserProfileController,
            write: true,
            apiHeaders: [AUTHORIZATION_HEADER],
            permission: Permission.Manage,
            check: [RouteCheck.ManageLocalUsers],
        }),
        privateUpdateUserProfile: makeRoute({
            route: 'POST /private/v1/management/users/:userId/profile',
            handler: management.updateUserProfileController,
            write: true,
            private: true,
            authPolicy: AuthPolicy.disabled,
        }),
        updateUserPassword: makeRoute({
            route: 'POST /v1/management/users/:userId/password',
            handler: management.updateUserPasswordController,
            write: true,
            apiHeaders: [AUTHORIZATION_HEADER],
            permission: Permission.Manage,
            check: [RouteCheck.ManageLocalUsers],
        }),
        privateUpdateUserPassword: makeRoute({
            route: 'POST /private/v1/management/users/:userId/password',
            handler: management.updateUserPasswordController,
            write: true,
            private: true,
            authPolicy: AuthPolicy.disabled,
        }),

        getUsersList: makeRoute({
            route: 'GET /v1/users/list',
            handler: users.getUsersListController,
            apiHeaders: [AUTHORIZATION_HEADER],
            permission: Permission.InstanceUse,
        }),
        getUsersByIds: makeRoute({
            route: 'POST /v1/users/get-by-ids',
            handler: users.getUsersByIdsController,
            apiHeaders: [AUTHORIZATION_HEADER],
            permission: Permission.InstanceUse,
        }),
        getMyUserProfile: makeRoute({
            route: 'GET /v1/users/me/profile',
            handler: users.getUserProfileController,
            apiHeaders: [AUTHORIZATION_HEADER],
        }),
        updateMyUserProfile: makeRoute({
            route: 'POST /v1/users/me/profile',
            handler: users.updateUserProfileController,
            write: true,
            apiHeaders: [AUTHORIZATION_HEADER],
            check: [RouteCheck.ManageLocalUsers],
        }),
        updateMyUserPassword: makeRoute({
            route: 'POST /v1/users/me/password',
            handler: users.updateUserPasswordController,
            write: true,
            apiHeaders: [AUTHORIZATION_HEADER],
            check: [RouteCheck.ManageLocalUsers],
        }),
    } satisfies Record<string, ExtendedAppRouteDescription>;

    const typedRoutes: {[key in keyof typeof routes]: ExtendedAppRouteDescription} = routes;
    return typedRoutes;
}
