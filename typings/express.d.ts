import type {RouteConfig as ZodOpenApiRouteConfig} from '@asteasolutions/zod-to-openapi';

import type {ApiHeader} from '../src/components/api-docs/types';
import type {Permission} from '../src/constants/permission';
import type {AuthorizedUser} from '../src/types/user';

declare global {
    namespace Express {
        interface User extends AuthorizedUser {}
    }
}

export interface SharedAppRouteParams {
    private?: boolean;
    write?: boolean;
    apiHeaders?: ApiHeader[];
    permission?: Permission;
}

export interface SharedAppRouteHandler {
    api?: Omit<ZodOpenApiRouteConfig, 'method' | 'path' | 'responses'> & {
        responses?: ZodOpenApiRouteConfig['responses'];
    };
}

declare module '@gravity-ui/expresskit' {
    export interface AppRouteParams extends SharedAppRouteParams {}

    export interface AppRouteHandler extends SharedAppRouteHandler {}
}
