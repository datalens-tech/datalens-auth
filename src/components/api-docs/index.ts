import {OpenAPIRegistry, OpenApiGeneratorV31} from '@asteasolutions/zod-to-openapi';
import {ExpressKit} from '@gravity-ui/expresskit';
import swaggerUi from 'swagger-ui-express';
import {ZodType} from 'zod';

import {MASTER_TOKEN_HEADER} from '../../constants/header';
import type {ExtendedAppRouteDescription} from '../../routes';
import {z} from '../zod';

import type {Method} from './types';

export {ApiTag} from './tags';

const openApiRegistry = new OpenAPIRegistry();

export const registerApiRoute = (
    routeDescription: ExtendedAppRouteDescription<unknown>,
    additionalHeaders?: ZodType<unknown>[],
) => {
    const {route, handler} = routeDescription;
    const {api} = handler;

    if (api) {
        const [rawMethod, rawPath] = route.split(' ');

        const method = rawMethod.toLowerCase() as Method;
        const path = `/${rawPath
            .split('/')
            .reduce<string[]>((acc, item) => {
                if (item) {
                    if (item.startsWith(':')) {
                        const [param, ...postfixes] = item.slice(1).split('[:]');
                        acc.push(
                            `{${param}}${postfixes.length > 0 ? `:${postfixes.join(':')}` : ''}`,
                        );
                    } else {
                        acc.push(item);
                    }
                }
                return acc;
            }, [])
            .join('/')}`;

        const headers: ZodType<unknown>[] = [];

        if (routeDescription.private) {
            headers.push(
                z.strictObject({
                    [MASTER_TOKEN_HEADER]: z.string(),
                }),
            );
        }

        if (additionalHeaders) {
            headers.push(...additionalHeaders);
        }

        if (api.request?.headers) {
            if (Array.isArray(api.request.headers)) {
                headers.push(...api.request.headers);
            } else {
                headers.push(api.request.headers);
            }
        }

        openApiRegistry.registerPath({
            method,
            path,
            ...api,
            request: {
                ...api.request,
                headers: [...headers],
            },
            responses: api.responses ?? {},
        });
    }
};

export const initSwagger = (app: ExpressKit) => {
    const {config} = app;

    const installationText = `Installation – <b>${config.appInstallation}</b>`;
    const envText = `Env – <b>${config.appEnv}</b>`;

    setImmediate(() => {
        app.express.use(
            '/api-docs',
            swaggerUi.serve,
            swaggerUi.setup(
                new OpenApiGeneratorV31(openApiRegistry.definitions).generateDocument({
                    openapi: '3.1.0',
                    info: {
                        version: `${config.appVersion}`,
                        title: `DataLens Auth Service `,
                        description: [installationText, envText].join('<br />'),
                    },
                    servers: [{url: '/'}],
                }),
            ),
        );
    });
};
