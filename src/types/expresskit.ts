import type {RouteConfig as ZodOpenApiRouteConfig} from '@asteasolutions/zod-to-openapi';

import type {ApiHeader} from '../components/api-docs/types';
import type {Permission} from '../constants/permission';

export interface PlatformAppRouteParams {
    private?: boolean;
    write?: boolean;
    apiHeaders?: ApiHeader[];
    permission?: Permission;
}

export interface PlatformAppRouteHandler {
    api?: Omit<ZodOpenApiRouteConfig, 'method' | 'path' | 'responses'> & {
        responses?: ZodOpenApiRouteConfig['responses'];
    };
}
