/* eslint-disable import/order */
import {nodekit} from './nodekit';
import {registerAppPlugins} from './registry/register-app-plugins';
import {AppMiddleware, AppRoutes, AuthPolicy, ExpressKit} from '@gravity-ui/expresskit';
import {
    checkReadOnlyMode,
    ctx,
    decodeId,
    finalRequestHandler,
    resolveSpecialTokens,
    setCiEnv,
    waitDatabase,
} from './components/middlewares';
import {AppEnv} from './constants/app';
import {registry} from './registry';
import {getRoutes} from './routes';
import {setRegistryToContext} from './components/app-context';
import {isEnabledFeature} from './components/features';
import {objectKeys} from './utils/utility-types';

setRegistryToContext(nodekit, registry);
registerAppPlugins();

const beforeAuth: AppMiddleware[] = [];
const afterAuth: AppMiddleware[] = [];

if (nodekit.config.appDevMode) {
    require('source-map-support').install();
}

if (
    nodekit.config.appEnv === AppEnv.Development &&
    nodekit.config.appAuthPolicy === AuthPolicy.disabled
) {
    beforeAuth.push(setCiEnv);
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

if (require.main === module) {
    app.run();
}

// it is allowed to use directly only for tests, in the application it must be used only through the registry
export default app;
