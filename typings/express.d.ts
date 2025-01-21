import type {RouteConfig as ZodOpenApiRouteConfig} from '@asteasolutions/zod-to-openapi';

import type {AuthorizedUser} from '../src/types/user';

declare global {
    namespace Express {
        interface User extends AuthorizedUser {}
    }
}

export interface SharedAppRouteParams {
    private?: boolean;
    write?: boolean;
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
