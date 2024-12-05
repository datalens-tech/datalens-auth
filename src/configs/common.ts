import {AuthPolicy} from '@gravity-ui/expresskit';
import type {AppConfig} from '@gravity-ui/nodekit';

import {Feature, FeaturesConfig} from '../components/features/types';
import {MASTER_TOKEN_HEADER} from '../constants/header';
import {getEnvTokenVariable} from '../utils/env-utils';

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

    appAuthPolicy: AuthPolicy.disabled, // fix ?

    appSensitiveKeys: [],
    appSensitiveHeaders: [MASTER_TOKEN_HEADER],

    masterToken: getEnvTokenVariable('MASTER_TOKEN'),

    features,
} satisfies Partial<AppConfig>;
