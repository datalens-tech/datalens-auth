import {AppMiddleware, AppRouteDescription, AuthPolicy} from '@gravity-ui/expresskit';
import type {HttpMethod} from '@gravity-ui/expresskit/dist/types';
import type {NodeKit} from '@gravity-ui/nodekit';
import passport from 'passport';

import {Feature} from './components/features';
import {AUTHORIZATION_HEADER} from './constants/header';
import {Permission} from './constants/permission';
import authController from './controllers/auth';
import helpersController from './controllers/helpers';
import homeController from './controllers/home';
import managementController from './controllers/management';

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
            handler: helpersController.ping,
            authPolicy: AuthPolicy.disabled,
        },
        pingDb: {
            route: 'GET /ping-db',
            handler: helpersController.pingDb,
            authPolicy: AuthPolicy.disabled,
        },
        pingDbPrimary: {
            route: 'GET /ping-db-primary',
            handler: helpersController.pingDbPrimary,
            authPolicy: AuthPolicy.disabled,
        },
        pool: {
            route: 'GET /pool',
            handler: helpersController.pool,
            authPolicy: AuthPolicy.disabled,
        },

        signinFail: {
            route: 'GET /signin-fail',
            handler: (_req, res) => {
                res.status(403).send('Forbidden');
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
        },
        signup: makeRoute({
            route: 'POST /signup',
            handler: authController.signup,
            authPolicy: AuthPolicy.disabled,
            write: true,
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

        createUser: makeRoute({
            route: 'POST /v1/management/users/create',
            handler: managementController.createUser,
            write: true,
            apiHeaders: [AUTHORIZATION_HEADER],
            permission: Permission.Manage,
        }),
    } satisfies Record<string, ExtendedAppRouteDescription>;

    const typedRoutes: {[key in keyof typeof routes]: ExtendedAppRouteDescription} = routes;
    return typedRoutes;
}
