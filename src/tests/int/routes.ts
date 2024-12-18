import type {NodeKit} from '@gravity-ui/nodekit';
import {ParamData, compile} from 'path-to-regexp';

import {GetRoutesOptions, getRoutes} from '../../routes';

type RouteName = keyof ReturnType<typeof getRoutes>;
const routes = getRoutes({} as NodeKit, {} as GetRoutesOptions);

export function makeRoute<P extends ParamData = ParamData>(routeName: RouteName, data?: P) {
    const route = routes[routeName].route.split(/\s+/)[1];
    const toPath = compile(route);
    return toPath(data);
}
