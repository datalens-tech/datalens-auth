import {AuthPolicy} from '@gravity-ui/expresskit';
import type {AppConfig} from '@gravity-ui/nodekit';

import {Feature, FeaturesConfig} from '../components/features/types';
import {MASTER_TOKEN_HEADER} from '../constants/header';
import {UserRole} from '../constants/role';
import {getEnvCert, getEnvTokenVariable, getEnvVariable, isTrueArg} from '../utils/env-utils';

export const features: FeaturesConfig = {
    [Feature.ReadOnlyMode]: false,
    [Feature.UseIpV6]: false,
};

export default {
    appName: 'datalens-auth',

    appSocket: 'dist/run/server.sock',

    expressTrustProxyNumber: 3,
    expressBodyParserJSONConfig: {
        limit: '50mb',
    },
    expressBodyParserURLEncodedConfig: {
        limit: '50mb',
        extended: false,
    },

    appAuthPolicy: AuthPolicy.required,

    defaultRole: UserRole.Viewer,

    uiAppEndpoint: process.env.UI_APP_ENDPOINT,

    accessTokenTTL: 60 * 15, // 15 min
    refreshTokenTTL: 60 * 60 * 24 * 10, // 10 days
    sessionTTL: 60 * 60 * 24 * 30, // 30 days

    tokenPrivateKey: getEnvCert(process.env.TOKEN_PRIVATE_KEY as string),
    tokenPublicKey: getEnvCert(process.env.TOKEN_PUBLIC_KEY as string),

    appSensitiveKeys: [],
    appSensitiveHeaders: [MASTER_TOKEN_HEADER],

    masterToken: getEnvTokenVariable('MASTER_TOKEN'),

    swaggerEnabled: isTrueArg(getEnvVariable('SWAGGER_ENABLED')),

    features,
} satisfies Partial<AppConfig>;
