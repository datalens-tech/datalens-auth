/* eslint-disable import/order */
import {nodekit} from './nodekit';
import {registerAppPlugins} from './registry/register-app-plugins';
import {AppMiddleware, AppRoutes, ExpressKit} from '@gravity-ui/expresskit';
import {
    appAuth,
    checkReadOnlyMode,
    ctx,
    decodeId,
    finalRequestHandler,
    resolveSpecialTokens,
    waitDatabase,
} from './components/middlewares';
import {registry} from './registry';
import {getRoutes} from './routes';
import {setRegistryToContext} from './components/app-context';
import {isEnabledFeature} from './components/features';
import {objectKeys} from './utils/utility-types';
import {initPassport} from './components/passport';

setRegistryToContext(nodekit, registry);
registerAppPlugins();

nodekit.config.appAuthHandler = appAuth;

const beforeAuth: AppMiddleware[] = [];
const afterAuth: AppMiddleware[] = [];

if (nodekit.config.appDevMode) {
    require('source-map-support').install();
}

afterAuth.push(decodeId, waitDatabase, resolveSpecialTokens, ctx, checkReadOnlyMode);

nodekit.config.appFinalErrorHandler = finalRequestHandler;

const extendedRoutes = getRoutes(nodekit, {beforeAuth, afterAuth});

const routes: AppRoutes = {};
objectKeys(extendedRoutes).forEach((key) => {
    const {route, features, ...params} = extendedRoutes[key];
    if (
        !Array.isArray(features) ||
        features.every((feature) => isEnabledFeature(nodekit.ctx, feature))
    ) {
        routes[route] = params;
    }
});

const app = new ExpressKit(nodekit, routes);
registry.setupApp(app);
initPassport();

if (require.main === module) {
    app.run();
}

// it is allowed to use directly only for tests, in the application it must be used only through the registry
export default app;
