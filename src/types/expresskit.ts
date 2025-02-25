import type {RouteConfig as ZodOpenApiRouteConfig} from '@asteasolutions/zod-to-openapi';

import type {ApiHeader} from '../components/api-docs/types';
import type {Permission} from '../constants/permission';
import type {RouteCheck} from '../constants/route';

export interface PlatformAppRouteParams {
    private?: boolean;
    write?: boolean;
    apiHeaders?: ApiHeader[];
    permission?: Permission;
    check?: RouteCheck[];
}

export interface PlatformAppRouteHandler {
    api?: Omit<ZodOpenApiRouteConfig, 'method' | 'path' | 'responses'> & {
        responses?: ZodOpenApiRouteConfig['responses'];
    };
}
